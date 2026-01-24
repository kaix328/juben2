import { useRef, useEffect, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useResizeObserver } from '@/app/hooks/useResizeObserver';
import type { CharacterBio, CharacterRelationship } from '../../../types/story-analysis';

interface CharacterNetworkGraphProps {
    characters: CharacterBio[];
    relationships: CharacterRelationship[];
    width?: number;
    height?: number;
}

export function CharacterNetworkGraph({ characters, relationships, width: propWidth, height: propHeight }: CharacterNetworkGraphProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { width: containerWidth, height: containerHeight } = useResizeObserver(containerRef);
    const fgRef = useRef<any>();

    // Node: Character
    // Link: Relationship
    const graphData = useMemo(() => {
        const nodes = characters.map(char => ({
            ...char,
            id: char.name,
            group: char.isProtagonist ? 1 : 2,
            val: char.isProtagonist ? 15 : 10, // Size
        }));

        const links = relationships.map(rel => ({
            ...rel,
            source: rel.fromCharacter,
            target: rel.toCharacter,
            label: rel.relationLabel,
            strength: rel.strength,
            color: getRelationColor(rel.relationType),
        }));

        return { nodes, links };
    }, [characters, relationships]);

    useEffect(() => {
        if (fgRef.current) {
            fgRef.current.d3Force('charge').strength(-200); // 增加排斥力
            fgRef.current.d3Force('link').distance(100);    // 增加连线长度
        }
    }, []);

    return (
        <div ref={containerRef} className="w-full h-full min-h-[400px] border rounded-lg bg-slate-50 overflow-hidden relative">
            <ForceGraph2D
                ref={fgRef}
                width={propWidth || containerWidth}
                height={propHeight || containerHeight}
                graphData={graphData}
                nodeLabel="name"
                nodeColor={node => (node.group === 1 ? '#a855f7' : '#64748b')} // Purple for protagonist
                nodeRelSize={6}

                // Link styling
                linkColor="color"
                linkWidth={link => (link.strength === 'strong' ? 3 : link.strength === 'weak' ? 1 : 2)}
                linkLabel="label"
                linkDirectionalArrowLength={3.5}
                linkDirectionalArrowRelPos={1}
                linkCurvature={0.2}

                // Custom painting for labels on links
                linkCanvasObjectMode={() => 'after'}
                linkCanvasObject={(link: any, ctx) => {
                    const MAX_FONT_SIZE = 4;
                    const LABEL_NODE_MARGIN = graphData.nodes[0].val * 1.5;

                    const start = link.source;
                    const end = link.target;

                    // ignore unbound links
                    if (typeof start !== 'object' || typeof end !== 'object') return;

                    // calculate label position
                    const textPos = Object.assign({}, ...['x', 'y'].map(c => ({
                        [c]: start[c] + (end[c] - start[c]) / 2 // calc middle point
                    })));

                    const relLink = { x: end.x - start.x, y: end.y - start.y };

                    const maxTextLength = Math.sqrt(Math.pow(relLink.x, 2) + Math.pow(relLink.y, 2)) - LABEL_NODE_MARGIN * 2;

                    let textAngle = Math.atan2(relLink.y, relLink.x);
                    // maintain label vertical orientation for legibility
                    if (textAngle > Math.PI / 2) textAngle = -(Math.PI - textAngle);
                    if (textAngle < -Math.PI / 2) textAngle = -(-Math.PI - textAngle);

                    const label = link.label;

                    // estimate fontSize to fit in link length
                    ctx.font = '3px Sans-Serif';
                    const fontSize = Math.min(MAX_FONT_SIZE, maxTextLength / ctx.measureText(label).width);
                    ctx.font = `${fontSize}px Sans-Serif`;
                    const textWidth = ctx.measureText(label).width;
                    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding

                    // draw text label (with background rect)
                    ctx.save();
                    ctx.translate(textPos.x, textPos.y);
                    ctx.rotate(textAngle);

                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.fillRect(-bckgDimensions[0] / 2, -bckgDimensions[1] / 2, ...bckgDimensions as [number, number]);

                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = link.color || '#999';
                    ctx.fillText(label, 0, 0);
                    ctx.restore();
                }}

                // Node painting (Text inside)
                nodeCanvasObject={(node: any, ctx, globalScale) => {
                    const label = node.name;
                    const fontSize = 12 / globalScale;
                    ctx.font = `${fontSize}px Sans-Serif`;

                    // const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding

                    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                    if (node.group === 1) ctx.fillStyle = 'rgba(243, 232, 255, 0.9)'; // lighter purple bg

                    ctx.beginPath();
                    ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
                    ctx.fillStyle = node.group === 1 ? '#a855f7' : '#64748b';
                    ctx.fill();

                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#fff';
                    ctx.fillText(label, node.x, node.y);
                }}
            />

            <div className="absolute top-2 right-2 bg-white/80 p-2 rounded text-xs text-gray-500 backdrop-blur-sm shadow-sm pointer-events-none">
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    主角
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                    配角
                </div>
            </div>
        </div>
    );
}

function getRelationColor(type: string): string {
    const map: Record<string, string> = {
        family: '#f97316', // orange
        romance: '#ec4899', // pink
        friendship: '#22c55e', // green
        rivalry: '#ef4444', // red
        enemy: '#991b1b', // dark red
        mentor: '#6366f1', // indigo
        colleague: '#64748b', // slate
        alliance: '#06b6d4', // cyan
        subordinate: '#d97706', // amber
    };
    return map[type] || '#94a3b8';
}
