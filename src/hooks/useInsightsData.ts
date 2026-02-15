/**
 * Computed insights from raw OJS + Matomo metrics
 * Transforms numbers into actionable intelligence
 */

import { UnifiedDashboardMetrics } from '@/services/fastStatsApi';

export interface HealthScore {
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  label: string;
  color: string;
}

export interface InsightItem {
  id: string;
  type: 'positive' | 'warning' | 'neutral' | 'critical';
  title: string;
  description: string;
  metric?: string;
  icon: string;
}

export interface FunnelStep {
  label: string;
  value: number;
  rate?: number;
  color: string;
}

export interface ComputedInsights {
  // Health scores
  overallHealth: HealthScore;
  engagementHealth: HealthScore;
  editorialHealth: HealthScore;
  impactHealth: HealthScore;

  // Key performance indicators
  viewsPerPublication: number;
  downloadsPerPublication: number;
  downloadToViewRatio: number;
  citationsPerPublication: number;
  avgCitationsPerCitedPub: number;
  publicationGrowthRate: number;

  // Funnel
  engagementFunnel: FunnelStep[];

  // Smart insights (natural language)
  insights: InsightItem[];

  // Recommendations
  recommendations: InsightItem[];

  // Benchmarks
  benchmarks: { label: string; value: number; benchmark: number; unit: string; status: 'above' | 'below' | 'average' }[];
}

function getGrade(score: number): HealthScore['grade'] {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A': return '#10b981';
    case 'B': return '#3b82f6';
    case 'C': return '#f59e0b';
    case 'D': return '#f97316';
    case 'F': return '#ef4444';
    default: return '#6b7280';
  }
}

function getHealthLabel(grade: string): string {
  switch (grade) {
    case 'A': return 'Excellent';
    case 'B': return 'Good';
    case 'C': return 'Fair';
    case 'D': return 'Needs Improvement';
    case 'F': return 'Critical';
    default: return 'Unknown';
  }
}

export function computeInsights(metrics: UnifiedDashboardMetrics | undefined): ComputedInsights | null {
  if (!metrics) return null;

  const totalPubs = metrics.totalPublications || 1;
  const totalViews = metrics.totalAbstractViews || 0;
  const totalDownloads = metrics.totalDownloads || 0;
  const totalAllViews = metrics.totalViews || 0;
  const totalCitations = metrics.allCitations?.summary?.totalCitations || metrics.citations?.totalCitations || 0;
  const citedPubs = metrics.allCitations?.summary?.publicationsWithCitations || metrics.citations?.publicationsWithCitations || 0;
  const totalUsers = metrics.totalUsers || 0;
  const acceptRate = metrics.acceptanceRate || 0;
  const rejectRate = metrics.rejectionRate || 0;

  // ── KPIs ──────────────────────────────────────
  const viewsPerPub = totalViews / totalPubs;
  const downloadsPerPub = totalDownloads / totalPubs;
  const dlToViewRatio = totalViews > 0 ? (totalDownloads / totalViews) * 100 : 0;
  const citationsPerPub = totalCitations / totalPubs;
  const avgCitPerCited = citedPubs > 0 ? totalCitations / citedPubs : 0;

  // Publication growth rate from publicationsByYear
  let pubGrowthRate = 0;
  if (metrics.publicationsByYear && metrics.publicationsByYear.length >= 2) {
    const sorted = [...metrics.publicationsByYear].sort((a, b) => a.year - b.year);
    const last = sorted[sorted.length - 1];
    const prev = sorted[sorted.length - 2];
    if (prev.count > 0) {
      pubGrowthRate = ((last.count - prev.count) / prev.count) * 100;
    }
  }

  // ── Health Scores ─────────────────────────────
  // Engagement: based on views/pub, dl ratio
  const engScore = Math.min(100, Math.round(
    (Math.min(viewsPerPub / 200, 1) * 40) +
    (Math.min(dlToViewRatio / 50, 1) * 30) +
    (Math.min(downloadsPerPub / 100, 1) * 30)
  ));
  const engGrade = getGrade(engScore);

  // Editorial: based on acceptance rate, queue health, submissions flow
  const queueRatio = metrics.submissionsQueued > 0 ? Math.min(metrics.submissionsQueued / (metrics.totalSubmissions || 1), 1) : 0;
  const editScore = Math.min(100, Math.round(
    (Math.min(acceptRate / 50, 1) * 35) +
    ((1 - queueRatio) * 30) +
    (Math.min(totalPubs / (metrics.totalSubmissions || 1), 1) * 35)
  ));
  const editGrade = getGrade(editScore);

  // Impact: based on citations, cited ratio
  const citedRatio = citedPubs / totalPubs;
  const impScore = Math.min(100, Math.round(
    (Math.min(citationsPerPub / 5, 1) * 40) +
    (Math.min(citedRatio, 1) * 35) +
    (Math.min(avgCitPerCited / 10, 1) * 25)
  ));
  const impGrade = getGrade(impScore);

  // Overall: weighted average
  const overallScore = Math.round(engScore * 0.35 + editScore * 0.35 + impScore * 0.30);
  const overallGrade = getGrade(overallScore);

  // ── Engagement Funnel ─────────────────────────
  const funnelSteps: FunnelStep[] = [
    { label: 'Page Views', value: totalAllViews, color: '#235dcb' },
    { label: 'Abstract Views', value: totalViews, rate: totalAllViews > 0 ? (totalViews / totalAllViews) * 100 : 0, color: '#1a5fb4' },
    { label: 'Downloads', value: totalDownloads, rate: totalViews > 0 ? (totalDownloads / totalViews) * 100 : 0, color: '#d4a017' },
    { label: 'Citations', value: totalCitations, rate: totalDownloads > 0 ? (totalCitations / totalDownloads) * 100 : 0, color: '#10b981' },
  ];

  // ── Smart Insights ────────────────────────────
  const insights: InsightItem[] = [];

  if (dlToViewRatio > 30) {
    insights.push({
      id: 'high-dl-ratio',
      type: 'positive',
      title: 'Strong Download Conversion',
      description: `${dlToViewRatio.toFixed(1)}% of abstract viewers go on to download the full paper — well above the typical 15-25% range.`,
      metric: `${dlToViewRatio.toFixed(1)}%`,
      icon: 'download',
    });
  } else if (dlToViewRatio < 10) {
    insights.push({
      id: 'low-dl-ratio',
      type: 'warning',
      title: 'Low Download Conversion',
      description: `Only ${dlToViewRatio.toFixed(1)}% of abstract viewers download full papers. Consider improving abstracts and ensuring PDFs are easily accessible.`,
      metric: `${dlToViewRatio.toFixed(1)}%`,
      icon: 'download',
    });
  }

  if (acceptRate > 0 && acceptRate < 30) {
    insights.push({
      id: 'selective-journal',
      type: 'positive',
      title: 'Highly Selective Journal',
      description: `With a ${acceptRate.toFixed(1)}% acceptance rate, your journal maintains rigorous quality standards comparable to top-tier publications.`,
      metric: `${acceptRate.toFixed(1)}%`,
      icon: 'shield',
    });
  } else if (acceptRate > 70) {
    insights.push({
      id: 'high-accept',
      type: 'warning',
      title: 'High Acceptance Rate',
      description: `${acceptRate.toFixed(1)}% acceptance rate is above the global average. Consider whether review rigor matches your quality goals.`,
      metric: `${acceptRate.toFixed(1)}%`,
      icon: 'alert',
    });
  }

  if (pubGrowthRate > 20) {
    insights.push({
      id: 'rapid-growth',
      type: 'positive',
      title: 'Rapid Publication Growth',
      description: `Publication output grew ${pubGrowthRate.toFixed(0)}% year-over-year — a sign of growing research community engagement.`,
      metric: `+${pubGrowthRate.toFixed(0)}%`,
      icon: 'trending-up',
    });
  } else if (pubGrowthRate < -10) {
    insights.push({
      id: 'declining-pubs',
      type: 'critical',
      title: 'Declining Publication Output',
      description: `Publication output decreased ${Math.abs(pubGrowthRate).toFixed(0)}% year-over-year. This may warrant attention to submission pipeline.`,
      metric: `${pubGrowthRate.toFixed(0)}%`,
      icon: 'trending-down',
    });
  }

  if (totalCitations > 0 && citedRatio > 0.5) {
    insights.push({
      id: 'high-citation-coverage',
      type: 'positive',
      title: 'Strong Citation Coverage',
      description: `${(citedRatio * 100).toFixed(0)}% of publications have been cited, indicating broad research impact.`,
      metric: `${(citedRatio * 100).toFixed(0)}%`,
      icon: 'quote',
    });
  }

  if (viewsPerPub > 100) {
    insights.push({
      id: 'high-engagement',
      type: 'positive',
      title: 'High Reader Engagement',
      description: `Each publication averages ${viewsPerPub.toFixed(0)} abstract views, showing strong discoverability and interest.`,
      metric: `${viewsPerPub.toFixed(0)}`,
      icon: 'eye',
    });
  }

  // Always add a total impact insight
  insights.push({
    id: 'total-reach',
    type: 'neutral',
    title: 'Total Research Reach',
    description: `${totalPubs.toLocaleString()} publications have generated ${totalAllViews.toLocaleString()} total views, ${totalDownloads.toLocaleString()} downloads, and ${totalCitations.toLocaleString()} citations.`,
    icon: 'globe',
  });

  // ── Recommendations ───────────────────────────
  const recommendations: InsightItem[] = [];

  if (dlToViewRatio < 20) {
    recommendations.push({
      id: 'rec-improve-dl',
      type: 'neutral',
      title: 'Improve Download Accessibility',
      description: 'Consider making PDFs more prominent on article pages and reducing barriers to full-text access.',
      icon: 'lightbulb',
    });
  }

  if (totalCitations === 0) {
    recommendations.push({
      id: 'rec-enable-citations',
      type: 'warning',
      title: 'Enable Citation Tracking',
      description: 'Set up Crossref or OpenAlex citation tracking to measure and showcase your research impact.',
      icon: 'link',
    });
  }

  if (metrics.totalSubmissions > 0 && metrics.submissionsQueued > metrics.totalSubmissions * 0.3) {
    recommendations.push({
      id: 'rec-clear-queue',
      type: 'warning',
      title: 'Address Submission Queue',
      description: `${metrics.submissionsQueued} submissions are queued (${((metrics.submissionsQueued / metrics.totalSubmissions) * 100).toFixed(0)}% of total). Consider expanding the reviewer pool.`,
      icon: 'users',
    });
  }

  if (metrics.publicationsByYear && metrics.publicationsByYear.length < 3) {
    recommendations.push({
      id: 'rec-build-history',
      type: 'neutral',
      title: 'Build Publication History',
      description: 'With limited year-over-year data, continue tracking to unlock growth trend insights.',
      icon: 'calendar',
    });
  }

  recommendations.push({
    id: 'rec-social-sharing',
    type: 'neutral',
    title: 'Promote on Social Media',
    description: 'Share top-performing articles on institutional social channels to increase visibility and citations.',
    icon: 'share',
  });

  // ── Benchmarks ────────────────────────────────
  const benchmarks = [
    {
      label: 'Acceptance Rate',
      value: acceptRate,
      benchmark: 30,
      unit: '%',
      status: acceptRate <= 35 ? 'above' as const : acceptRate <= 60 ? 'average' as const : 'below' as const,
    },
    {
      label: 'Views per Publication',
      value: Math.round(viewsPerPub),
      benchmark: 150,
      unit: '',
      status: viewsPerPub >= 150 ? 'above' as const : viewsPerPub >= 50 ? 'average' as const : 'below' as const,
    },
    {
      label: 'Download Conversion',
      value: Math.round(dlToViewRatio),
      benchmark: 20,
      unit: '%',
      status: dlToViewRatio >= 25 ? 'above' as const : dlToViewRatio >= 12 ? 'average' as const : 'below' as const,
    },
    {
      label: 'Citations per Publication',
      value: Number(citationsPerPub.toFixed(1)),
      benchmark: 3,
      unit: '',
      status: citationsPerPub >= 3 ? 'above' as const : citationsPerPub >= 1 ? 'average' as const : 'below' as const,
    },
  ];

  return {
    overallHealth: { score: overallScore, grade: overallGrade, label: getHealthLabel(overallGrade), color: getGradeColor(overallGrade) },
    engagementHealth: { score: engScore, grade: engGrade, label: getHealthLabel(engGrade), color: getGradeColor(engGrade) },
    editorialHealth: { score: editScore, grade: editGrade, label: getHealthLabel(editGrade), color: getGradeColor(editGrade) },
    impactHealth: { score: impScore, grade: impGrade, label: getHealthLabel(impGrade), color: getGradeColor(impGrade) },

    viewsPerPublication: viewsPerPub,
    downloadsPerPublication: downloadsPerPub,
    downloadToViewRatio: dlToViewRatio,
    citationsPerPublication: citationsPerPub,
    avgCitationsPerCitedPub: avgCitPerCited,
    publicationGrowthRate: pubGrowthRate,

    engagementFunnel: funnelSteps,
    insights,
    recommendations,
    benchmarks,
  };
}
