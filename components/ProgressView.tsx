
import React from 'react';
import { Note, ProgressAnalysis, QuizResult } from '../types';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ProgressViewProps {
  progress: ProgressAnalysis | null;
  notes: Note[];
  quizHistory: QuizResult[];
  onAction?: (action: NonNullable<ProgressAnalysis['nextBestAction']>) => void;
  userEmail?: string;
  isDark: boolean;
}

const ProgressView: React.FC<ProgressViewProps> = ({ progress, notes, quizHistory, onAction, userEmail, isDark }) => {
  // Now tracks progress after just 1 quiz attempt
  const DATA_THRESHOLD = 1;
  const REPORT_CARD_THRESHOLD = 3;
  const hasEnoughData = quizHistory.length >= DATA_THRESHOLD;
  const canDownloadReport = quizHistory.length >= REPORT_CARD_THRESHOLD;

  const totalCorrect = quizHistory.reduce((sum, q) => sum + q.score, 0);
  const totalQuestions = quizHistory.reduce((sum, q) => sum + q.total, 0);
  const realMastery = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const chartData = quizHistory.map((q, i) => ({
    name: `Q${i + 1}`,
    score: Math.round((q.score / q.total) * 100),
  }));

  const generateReportCard = () => {
    const doc = new jsPDF();
    const primaryColor: [number, number, number] = [38, 186, 164]; // #26BAA4
    const accentColor: [number, number, number] = [249, 115, 22]; // orange-500
    
    // Header
    doc.setFillColor(38, 186, 164);
    doc.rect(0, 0, 210, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('AI PERFORMANCE COACH', 105, 22, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('PREDICTIVE EXAM ANALYSIS & ACTION PLAN', 105, 32, { align: 'center' });
    doc.text(`Student: ${userEmail || 'Anonymous Student'} | ${new Date().toLocaleDateString()}`, 105, 38, { align: 'center' });

    let currentY = 60;

    // 1. Overall Performance Summary
    doc.setTextColor(38, 186, 164);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('1. OVERALL PERFORMANCE SUMMARY', 20, currentY);
    currentY += 10;
    
    doc.setTextColor(45, 45, 45);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const totalCorrect = quizHistory.reduce((sum, q) => sum + q.score, 0);
    const totalQuestions = quizHistory.reduce((sum, q) => sum + q.total, 0);
    const mastery = Math.round((totalCorrect / totalQuestions) * 100);
    doc.text(`Current Mastery Level: ${mastery}%`, 25, currentY);
    currentY += 7;
    doc.text(`Quizzes Completed: ${quizHistory.length}`, 25, currentY);
    currentY += 7;
    doc.text(`Study Level: ${progress?.level || 'N/A'}`, 25, currentY);
    currentY += 15;

    // 2. Predicted Score & Growth Potential
    if (progress?.prediction) {
      doc.setTextColor(249, 115, 22);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('2. PREDICTED SCORE & GROWTH POTENTIAL', 20, currentY);
      currentY += 10;

      doc.setTextColor(45, 45, 45);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Predicted Score (Current Pace): ${progress.prediction.predictedScore}%`, 25, currentY);
      currentY += 7;
      doc.setTextColor(38, 186, 164);
      doc.text(`Potential Score (Optimized): ${progress.prediction.potentialScore}%`, 25, currentY);
      currentY += 7;
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'italic');
      doc.text(`*Estimated timeframe for improvement: ${progress.prediction.timeframeDays} days`, 25, currentY);
      currentY += 15;
    }

    // 3. Student Type Analysis
    if (progress?.studentType) {
      doc.setTextColor(38, 186, 164);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('3. STUDENT TYPE ANALYSIS', 20, currentY);
      currentY += 10;

      doc.setTextColor(45, 45, 45);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Type: "${progress.studentType.label}"`, 25, currentY);
      currentY += 7;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(progress.studentType.analysis, 25, currentY, { maxWidth: 160 });
      currentY += 20;
    }

    // 4. Strengths & Weaknesses (Ranked)
    if (progress?.rankedWeaknesses) {
      doc.setTextColor(38, 186, 164);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('4. RANKED WEAKNESSES (PRIORITY)', 20, currentY);
      currentY += 10;

      const weaknessData = progress.rankedWeaknesses.map(w => [
        w.topic,
        w.priority,
        w.reason
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Topic', 'Priority', 'Reason / Insight']],
        body: weaknessData,
        headStyles: { fillColor: [239, 68, 68] }, // Red for weaknesses
        styles: { fontSize: 9 },
        margin: { left: 25 }
      });
      currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Check for page break
    if (currentY > 230) {
      doc.addPage();
      currentY = 30;
    }

    // 5. Learning Pattern Insights
    if (progress?.learningInsights) {
      doc.setTextColor(38, 186, 164);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('5. LEARNING PATTERN INSIGHTS', 20, currentY);
      currentY += 10;

      doc.setTextColor(45, 45, 45);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      progress.learningInsights.forEach(insight => {
        doc.text(`\u2022 ${insight}`, 25, currentY, { maxWidth: 160 });
        currentY += 7;
      });
      currentY += 10;
    }

    // 6. Recommended Action Plan (Day-by-Day)
    if (progress?.actionPlan) {
      doc.setTextColor(249, 115, 22);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('6. RECOMMENDED ACTION PLAN (3-DAY)', 20, currentY);
      currentY += 10;

      progress.actionPlan.forEach(plan => {
        doc.setTextColor(45, 45, 45);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`Day ${plan.day}:`, 25, currentY);
        currentY += 6;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        plan.tasks.forEach(task => {
          doc.text(`- ${task}`, 30, currentY);
          currentY += 5;
        });
        currentY += 5;
      });
      currentY += 10;
    }

    // Final Coach Message
    doc.setTextColor(38, 186, 164);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bolditalic');
    const message = mastery > 75 
      ? "You're on the right track, but don't get complacent. Precision is what separates the top 1% from the rest."
      : "You are currently losing marks due to avoidable patterns. Follow the action plan above strictly to see a 15-20% jump in your next quiz.";
    doc.text('COACH\'S FINAL WORD:', 20, currentY);
    currentY += 8;
    doc.setTextColor(45, 45, 45);
    doc.setFontSize(11);
    doc.text(message, 25, currentY, { maxWidth: 160 });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Generated by Second Brain AI Coach - Precision Learning System', 105, 285, { align: 'center' });

    doc.save(`AI_Coach_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (notes.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1A1A1A] border border-[#E5E2D9] dark:border-[#262626] rounded-2xl p-20 text-center shadow-sm">
        <div className="w-24 h-24 bg-[#26BAA4]/10 rounded-full flex items-center justify-center mx-auto mb-10 animate-pulse">
          <svg className="w-12 h-12 text-[#26BAA4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <h2 className="text-3xl font-black text-[#2D2D2D] dark:text-[#E5E5E5] mb-4 tracking-tight">No Progress Data Yet</h2>
        <p className="text-[#666] dark:text-[#AAA] max-w-md mx-auto leading-relaxed text-lg">Upload your notes and take some quizzes to see how you're doing.</p>
      </div>
    );
  }

  if (!hasEnoughData) {
    return (
      <div className="bg-white dark:bg-[#1A1A1A] border border-[#E5E2D9] dark:border-[#262626] rounded-2xl p-20 text-center shadow-sm flex flex-col items-center">
        <div className="w-20 h-20 bg-orange-50 dark:bg-orange-900/10 rounded-full flex items-center justify-center mb-10">
          <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-3xl font-black text-[#2D2D2D] dark:text-[#E5E5E5] mb-4 tracking-tighter">Waiting for First Quiz</h2>
        <p className="text-[#666] dark:text-[#AAA] max-w-md mx-auto leading-relaxed text-lg font-medium mb-4">
          Take your first quiz to see your study profile.
        </p>
        <p className="text-[#AAA] text-sm italic">Just one quiz is enough to start tracking your progress.</p>
      </div>
    );
  }

  // Calculate local topic mastery as fallback
  const localTopicStats = quizHistory.reduce((acc, quiz) => {
    quiz.errors?.forEach(err => {
      if (!acc[err.conceptTag]) acc[err.conceptTag] = { correct: 0, total: 0 };
      acc[err.conceptTag].total++;
    });
    // We don't easily know all concepts from the quiz result alone without the questions,
    // but we can at least track the ones they got wrong.
    return acc;
  }, {} as Record<string, { correct: number, total: number }>);

  const localWeakSpots = Object.entries(localTopicStats)
    .filter(([_, stats]) => stats.total > 0)
    .map(([tag]) => tag);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-6xl mx-auto pb-20">
      {/* Next Best Action */}
      {progress?.nextBestAction && (
        <div className="bg-[#2D2D2D] dark:bg-[#1A1A1A] text-white rounded-[2.5rem] p-10 sm:p-14 shadow-2xl relative overflow-hidden border border-white/5 glow-brand-strong">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#26BAA4]/10 rounded-full -mr-48 -mt-48 blur-3xl animate-pulse"></div>
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="space-y-6 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start space-x-4">
                <span className="text-[10px] font-black text-[#26BAA4] uppercase tracking-[0.5em] text-glow-brand">Priority Action</span>
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-ping shadow-[0_0_10px_#F97316]"></span>
              </div>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-[0.9] max-w-2xl text-glow-white">
                {progress.nextBestAction.title}
              </h2>
              <p className="text-[#AAA] font-medium text-lg sm:text-xl max-w-xl leading-relaxed">
                {progress.nextBestAction.description}
              </p>
              <div className="flex items-center justify-center lg:justify-start space-x-3 text-[#26BAA4] font-bold text-sm uppercase tracking-widest">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span>{progress.nextBestAction.impact}</span>
              </div>
            </div>
            <button 
              onClick={() => onAction?.(progress.nextBestAction!)}
              className="group bg-[#26BAA4] hover:bg-[#219B88] text-white px-10 py-5 rounded-2xl font-bold text-sm transition-all shadow-xl shadow-[#26BAA4]/20 flex items-center space-x-3 uppercase tracking-[0.2em] whitespace-nowrap active:scale-95"
            >
              <span>Execute Plan</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2 bg-white dark:bg-[#1A1A1A] border border-[#E5E2D9] dark:border-[#262626] rounded-[2rem] p-10 shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#26BAA4]/5 rounded-full -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <span className="text-[10px] font-bold text-[#26BAA4] uppercase tracking-[0.3em] mb-4 block">Mastery Level</span>
              <div className="text-7xl font-bold text-[#2D2D2D] dark:text-[#E5E5E5] tracking-tighter tabular-nums leading-none text-glow-brand">{realMastery}%</div>
            </div>
            {canDownloadReport && (
              <button 
                onClick={generateReportCard}
                className="bg-white dark:bg-[#2D2D2D] border border-[#26BAA4] text-[#26BAA4] hover:bg-[#26BAA4] hover:text-white px-5 py-2.5 rounded-xl text-[10px] font-bold transition-all flex items-center space-x-2 shadow-sm uppercase tracking-widest active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Report Card</span>
              </button>
            )}
          </div>
          <div className="mt-12 relative z-10">
            <div className="flex justify-between text-[10px] font-bold uppercase mb-3">
              <span className="text-[#AAA] tracking-widest">Based on {quizHistory.length} Sessions</span>
              <span className="text-[#26BAA4]">{realMastery}%</span>
            </div>
            <div className="h-3 bg-[#FDFCF8] dark:bg-[#111] rounded-full border border-[#E5E2D9] dark:border-[#262626] overflow-hidden">
              <div className="h-full bg-[#26BAA4] transition-all duration-1000 ease-out" style={{ width: `${realMastery}%` }}></div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1A1A1A] border border-[#E5E2D9] dark:border-[#262626] rounded-[2rem] p-10 shadow-sm flex flex-col justify-center items-center text-center group glow-orange">
          <div className="w-14 h-14 bg-orange-50 dark:bg-orange-900/10 rounded-2xl flex items-center justify-center text-orange-500 mb-6 shadow-sm group-hover:rotate-12 transition-transform">
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z"/></svg>
          </div>
          <div className="text-4xl font-bold text-[#2D2D2D] dark:text-[#E5E5E5] tracking-tighter">{quizHistory.length}</div>
          <span className="text-[10px] font-bold text-[#AAA] uppercase tracking-[0.2em] mt-2">Quizzes</span>
        </div>

        <div className="bg-white dark:bg-[#1A1A1A] border border-[#E5E2D9] dark:border-[#262626] rounded-[2rem] p-10 shadow-sm flex flex-col justify-center items-center text-center relative overflow-hidden group glow-blue">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full -mr-10 -mt-10"></div>
          <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/10 rounded-2xl flex items-center justify-center text-blue-500 mb-6 shadow-sm group-hover:-rotate-12 transition-transform">
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm.5 11H7v-2h5.5V7H14v6l5.25 3.15-.75-1.23-4.5-2.67z"/></svg>
          </div>
          <div className="text-4xl font-bold text-[#2D2D2D] dark:text-[#E5E5E5] tracking-tighter">{progress?.level || (realMastery > 70 ? 'High' : 'Mod')}</div>
          <span className="text-[10px] font-bold text-[#AAA] uppercase tracking-[0.2em] mt-2">Level</span>
        </div>
      </div>

      {/* Mistake Breakdown & Patterns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-[#1A1A1A] border border-[#E5E2D9] dark:border-[#262626] rounded-[2rem] p-10 shadow-sm">
          <h3 className="text-[10px] font-bold text-[#26BAA4] uppercase tracking-[0.4em] mb-8">Mistake Breakdown</h3>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-[#FDFCF8] dark:bg-[#111] p-6 rounded-2xl border border-[#E5E2D9] dark:border-[#262626] text-center">
                <span className="text-[10px] font-bold text-[#AAA] uppercase tracking-widest block mb-2">Silly Errors</span>
                <div className="text-4xl font-bold text-orange-500 tracking-tighter">
                  {quizHistory.reduce((acc, q) => acc + (q.errors?.filter(e => e.type === 'careless').length || 0), 0)}
                </div>
              </div>
              <div className="bg-[#FDFCF8] dark:bg-[#111] p-6 rounded-2xl border border-[#E5E2D9] dark:border-[#262626] text-center">
                <span className="text-[10px] font-bold text-[#AAA] uppercase tracking-widest block mb-2">Concept Errors</span>
                <div className="text-4xl font-bold text-red-500 tracking-tighter">
                  {quizHistory.reduce((acc, q) => acc + (q.errors?.filter(e => e.type === 'concept').length || 0), 0)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1A1A1A] border border-[#E5E2D9] dark:border-[#262626] rounded-[2rem] p-10 shadow-sm">
          <h3 className="text-[10px] font-bold text-[#26BAA4] uppercase tracking-[0.4em] mb-8">Learning Patterns</h3>
          <div className="space-y-4">
            {progress?.weaknessPatterns && progress.weaknessPatterns.length > 0 ? (
              progress.weaknessPatterns.map((pattern, i) => (
                <div key={i} className="text-sm text-[#666] dark:text-[#AAA] font-semibold flex items-start space-x-4 bg-[#FDFCF8] dark:bg-[#111] p-4 rounded-xl border border-[#E5E2D9]/50 dark:border-[#262626]/50">
                  <span className="mt-2 w-2 h-2 bg-[#26BAA4] rounded-full shrink-0 shadow-[0_0_10px_rgba(38,186,164,0.4)]"></span>
                  <span>{pattern}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-sm text-[#AAA] italic font-medium">AI is analyzing your learning style...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Graph */}
      <div className="bg-white dark:bg-[#1A1A1A] border border-[#E5E2D9] dark:border-[#262626] rounded-[2rem] p-10 shadow-sm">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-[10px] font-bold text-[#26BAA4] uppercase tracking-[0.4em]">Performance Curve</h3>
            <p className="text-[10px] text-[#AAA] font-bold mt-2 uppercase tracking-[0.2em]">Score trends over time</p>
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#26BAA4" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#26BAA4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#262626" : "#F0EDE4"} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 800, fill: '#AAA' }}
                dy={15}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 800, fill: '#AAA' }}
                domain={[0, 100]}
                dx={-10}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? '#1A1A1A' : '#FFF', 
                  border: `1px solid ${isDark ? '#262626' : '#E5E2D9'}`, 
                  borderRadius: '16px',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                }}
                itemStyle={{ color: '#26BAA4', fontWeight: 900, fontSize: '12px' }}
                labelStyle={{ fontWeight: 900, fontSize: '10px', marginBottom: '6px', color: isDark ? '#E5E5E5' : '#2D2D2D', textTransform: 'uppercase', letterSpacing: '0.1em' }}
              />
              <Area 
                type="monotone" 
                dataKey="score" 
                stroke="#26BAA4" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorScore)" 
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Analysis & History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          <h3 className="text-[10px] font-bold text-[#26BAA4] uppercase tracking-[0.4em]">Topic Mastery</h3>
          {progress ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {progress.subjects.map((subj, idx) => (
                <div key={idx} className="bg-white dark:bg-[#1A1A1A] border border-[#E5E2D9] dark:border-[#262626] rounded-2xl p-8 shadow-sm hover:glow-border-brand transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#26BAA4]/5 rounded-full -mr-12 -mt-12 group-hover:scale-125 transition-transform duration-500"></div>
                  <div className="flex justify-between items-start mb-8 relative z-10">
                    <div>
                      <h4 className="font-bold text-xl text-[#2D2D2D] dark:text-[#E5E5E5] tracking-tight">{subj.name}</h4>
                      <span className="text-[10px] font-bold text-[#26BAA4] uppercase tracking-widest text-glow-brand">{subj.completionPercentage}% Mastery</span>
                    </div>
                  </div>
                  <div className="space-y-6 relative z-10">
                    <div>
                      <span className="text-[9px] font-bold uppercase text-red-500 tracking-[0.2em] mb-3 block">Weak Spots</span>
                      <div className="flex flex-wrap gap-2">
                        {subj.weakness.length > 0 ? subj.weakness.map((w, i) => (
                          <span key={i} className="text-[10px] font-bold bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-lg border border-red-100 dark:border-red-900/20">#{w}</span>
                        )) : (
                          <span className="text-[10px] text-[#AAA] italic font-medium">No weak spots identified</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold uppercase text-[#26BAA4] tracking-[0.2em] mb-3 block">Strong Spots</span>
                      <div className="flex flex-wrap gap-2">
                        {subj.strength.length > 0 ? subj.strength.slice(0, 4).map((t, i) => (
                          <span key={i} className="text-[10px] font-bold bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400 px-2.5 py-1 rounded-lg border border-green-100 dark:border-green-900/20">#{t}</span>
                        )) : (
                          <span className="text-[10px] text-[#AAA] italic font-medium">Keep practicing to identify strengths</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1A1A1A] border border-[#E5E2D9] dark:border-[#262626] rounded-2xl p-12">
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <p className="text-xs text-[#AAA] font-bold uppercase tracking-widest">AI Analysis in Progress</p>
              </div>
              
              <div className="space-y-8">
                <div>
                  <span className="text-[9px] font-bold uppercase text-red-500 tracking-[0.2em] mb-4 block">Identified Weak Spots (Local)</span>
                  {localWeakSpots.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {localWeakSpots.map((tag, i) => (
                        <span key={i} className="text-[10px] font-bold bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-lg border border-red-100 dark:border-red-900/20">#{tag}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#AAA] italic font-medium">No weak spots found yet. Great job!</p>
                  )}
                </div>

                <div className="p-6 bg-[#FDFCF8] dark:bg-[#111] rounded-2xl border border-dashed border-[#E5E2D9] dark:border-[#262626] text-center">
                  <p className="text-xs text-[#AAA] font-medium leading-relaxed">
                    Our AI is currently crunching your data to provide a detailed subject-by-subject breakdown. 
                    This usually takes a few seconds after your first few quizzes.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-8">
          <h3 className="text-[10px] font-bold text-[#26BAA4] uppercase tracking-[0.4em]">Quiz History</h3>
          <div className="bg-white dark:bg-[#1A1A1A] border border-[#E5E2D9] dark:border-[#262626] rounded-[2rem] p-8 shadow-sm space-y-4">
            {quizHistory.length > 0 ? (
              quizHistory.slice(-10).reverse().map((res, i) => (
                <div key={i} className="flex justify-between items-center p-4 bg-[#FDFCF8] dark:bg-[#111] rounded-2xl border border-[#E5E2D9]/50 dark:border-[#262626]/50 hover:border-[#26BAA4]/30 transition-all group">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#2D2D2D] dark:text-[#E5E5E5] group-hover:text-[#26BAA4] transition-colors">Attempt {quizHistory.length - i}</span>
                    <span className="text-[9px] text-[#AAA] uppercase font-bold tracking-widest mt-1">{new Date(res.timestamp).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className={`text-sm font-black ${res.score / res.total > 0.7 ? 'text-[#26BAA4]' : 'text-orange-500'}`}>
                        {res.score}/{res.total}
                      </div>
                      <div className="text-[8px] text-[#AAA] font-bold uppercase tracking-tighter">{Math.round((res.score / res.total) * 100)}%</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-sm text-[#AAA] italic font-medium">No sessions recorded yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressView;
