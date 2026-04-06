import { useParams, Navigate } from 'react-router-dom';
import { useAppData } from '@/hooks/useAppData';
import { BusinessBillPage } from './BusinessBillPage';

const COLOR_MAP: Record<string, string> = {
  '研习社': 'pink',
  '三和·小剪刀': 'purple',
};

function getAccentColor(project: { type: string; name: string }) {
  return COLOR_MAP[project.name] || 'purple';
}

export default function DynamicBusinessPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { state } = useAppData();

  const project = state.projects.find((p) => p.id === projectId);
  if (!project) return <Navigate to="/" replace />;

  return (
    <BusinessBillPage
      projectId={project.id}
      title={project.name}
      accentColor={getAccentColor(project)}
      showPeriodFilter={!!(project.periods && project.periods.length > 0)}
    />
  );
}
