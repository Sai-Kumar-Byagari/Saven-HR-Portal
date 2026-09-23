import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import Spinner from '../../components/ui/Spinner';
import Avatar from '../../components/ui/Avatar';
import { ROLE_LABELS } from '../../config/roles';

/* ── Card ─────────────────────────────────────────────────────────────────── */
function Card({ node }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-4 py-3 w-[140px] text-center hover:shadow-md transition-shadow">
      <div className="flex justify-center mb-2">
        <Avatar name={node.name} role={node.role} size="md" />
      </div>
      <p className="text-[12px] font-bold text-gray-900 leading-tight truncate">{node.name}</p>
      <p className="text-[11px] text-gray-400 mt-0.5">{ROLE_LABELS[node.role] || node.role}</p>
      <p className="text-[10px] text-blue-500 mt-0.5 truncate" title={node.workEmail}>{node.workEmail}</p>
    </div>
  );
}

/* ── Tree node — renders card + children connected with lines ─────────────── */
function TreeNode({ node }) {
  const children = node.children || [];
  const hasChildren = children.length > 0;

  return (
    <div className="flex flex-col items-center">
      {/* The card itself */}
      <Card node={node} />

      {hasChildren && (
        <div className="flex flex-col items-center w-full">
          {/* Vertical line down from this card */}
          <div className="w-px h-6 bg-gray-300" />

          {children.length === 1 ? (
            /* ── Single child: just straight vertical line ── */
            <TreeNode node={children[0]} />
          ) : (
            /* ── Multiple children: T-branch ── */
            <div className="flex flex-col items-center w-full">
              {/* Row of children with relative positioning for the horizontal bar */}
              <div className="relative flex items-start justify-center gap-8">
                {/* Horizontal connector bar — sits at top of this div */}
                <div
                  className="absolute top-0 h-px bg-gray-300"
                  style={{
                    width: '100%', transform: 'none',
                    left: `calc(50% / ${children.length})`,
                    right: `calc(50% / ${children.length})`,
                  }}
                />

                {children.map((child) => (
                  <div key={child.id} className="flex flex-col items-center">
                    {/* Short vertical drop from horizontal bar to child */}
                    <div className="w-px h-6 bg-gray-300" />
                    <TreeNode node={child} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Proper T-branch using SVG lines ──────────────────────────────────────── */
function TreeNodeSVG({ node, x, y, nodeW = 140, nodeH = 100, gapX = 60, gapY = 80 }) {
  /* We'll use pure CSS flex instead — see below */
  return null;
}

/* ── Clean flex-based tree ────────────────────────────────────────────────── */
function FlexTree({ node }) {
  const children = node.children || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      {/* Card */}
      <Card node={node} />

      {children.length > 0 && (
        <>
          {/* │ stem down */}
          <div style={{ width: 1, height: 24, background: '#d1d5db' }} />

          {children.length === 1 ? (
            <FlexTree node={children[0]} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Horizontal bar — uses a bordered top on a flex row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
                {/* The horizontal line drawn as a pseudo-element via inline style trick */}
                {children.map((child, i) => (
                  <div
                    key={child.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      marginLeft: i === 0 ? 0 : 32,
                      position: 'relative',
                    }}
                  >
                    {/* Top border forms the horizontal connector */}
                    <div style={{ width: 1, height: 24, background: '#d1d5db' }} />
                    <FlexTree node={child} />
                  </div>
                ))}

                {/* Absolute horizontal line across all children tops */}
                <HorizontalBridge count={children.length} gap={32} nodeW={140} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function HorizontalBridge({ count, gap, nodeW }) {
  /* Spans from center of first child to center of last child */
  const totalWidth = count * nodeW + (count - 1) * gap;
  const lineLeft = nodeW / 2;
  const lineRight = nodeW / 2;
  const lineWidth = totalWidth - lineLeft - lineRight;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: nodeW / 2,
        width: lineWidth + nodeW * (count - 1) / count,
        height: 1,
        background: '#d1d5db',
        pointerEvents: 'none',
      }}
    />
  );
}

/* ── FINAL clean implementation using border trick ────────────────────────── */
function Node({ node }) {
  const children = node.children || [];

  return (
    <div className="flex flex-col items-center">
      <Card node={node} />

      {children.length > 0 && (
        <div className="flex flex-col items-center">
          {/* Stem down */}
          <div className="w-px h-6 bg-gray-300" />

          {/* Children container */}
          <div className="flex items-start" style={{ gap: '40px' }}>
            {children.map((child, idx) => (
              <div key={child.id} className="flex flex-col items-center relative">
                {/* Each child gets a stub going up */}
                <div className="w-px h-6 bg-gray-300" />
                <Node node={child} />
              </div>
            ))}
          </div>

          {/* Horizontal bar connecting all children stubs at top */}
        </div>
      )}
    </div>
  );
}

/* ── FINAL — using a wrapper that draws horizontal line above children ─────── */
function OrgNode({ node }) {
  const children = node.children || [];

  return (
    <div className="flex flex-col items-center">
      {/* Card */}
      <Card node={node} />

      {children.length > 0 && (
        <>
          {/* Vertical stem down */}
          <div className="w-px h-6 bg-gray-300 shrink-0" />

          {children.length === 1 ? (
            <OrgNode node={children[0]} />
          ) : (
            // Wrap children in a box whose top border acts as horizontal connector
            <div
              className="flex items-start"
              style={{
                gap: '40px',
                borderTop: '1px solid #d1d5db',
                paddingTop: 0,
              }}
            >
              {children.map((child) => (
                <div key={child.id} className="flex flex-col items-center">
                  {/* Vertical stub from horizontal bar down to child */}
                  <div className="w-px h-6 bg-gray-300 shrink-0" />
                  <OrgNode node={child} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default function OrgChartPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['orgchart'],
    queryFn: async () => {
      const r = await api.get('/orgchart');
      return r.data.data;
    },
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (error)     return <div className="text-center py-20 text-red-500">Failed to load org chart.</div>;
  if (!data?.length) return <div className="text-center py-20 text-gray-400">No employees found.</div>;

  // Backend now always returns single super_admin root
  const tree = data[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Organisation Chart</h1>
        <p className="text-gray-400 text-sm mt-1">Reporting hierarchy at Saven Technologies</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-auto p-10">
        <div className="flex justify-center min-w-max">
          <OrgNode node={tree} />
        </div>
      </div>
    </div>
  );
}
