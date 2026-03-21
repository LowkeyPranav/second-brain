
import React from 'react';
import { PlanType } from '../types';

interface SubscriptionViewProps {
  onSelectPlan: (plan: PlanType) => void;
  currentPlan: PlanType;
}

const SubscriptionView: React.FC<SubscriptionViewProps> = ({ onSelectPlan, currentPlan }) => {
  const plans = [
    {
      name: 'Basic' as PlanType,
      price: '$0',
      period: '(Free for 1 year)',
      color: '#26BAA4',
      features: {
        'Upload documents': 'Yes',
        'Al-generated summaries': 'Basic',
        'AI Assistant (mini-you)': 'Limited',
        'Ask ANY question': false,
        'Quiz Center': false,
        'Wrong-answer explanations': false,
        'Progress tracking': false,
        'Topic mastery levels': false,
        'Strategic lessons': false,
        'Solved examples': false,
        'Adaptive study plan': false,
        'Early feature access': false,
      }
    },
    {
      name: 'Brain Plus+' as PlanType,
      price: '$2.99',
      period: '/ month',
      yearly: '$24 / year',
      color: '#3B82F6',
      features: {
        'Upload documents': 'Yes',
        'Al-generated summaries': 'Full',
        'AI Assistant (mini-you)': 'Unlimited',
        'Ask ANY question': 'Yes',
        'Quiz Center': 'Yes',
        'Wrong-answer explanations': 'Yes',
        'Progress tracking': 'After 3 quizzes',
        'Topic mastery levels': 'Yes',
        'Strategic lessons': 'Basic',
        'Solved examples': 'Limited',
        'Adaptive study plan': false,
        'Early feature access': false,
      }
    },
    {
      name: 'Brain Ultra' as PlanType,
      price: '$4.99',
      period: '/ month',
      yearly: '$59 / year',
      color: '#8B5CF6',
      featured: true,
      features: {
        'Upload documents': 'Yes',
        'Al-generated summaries': 'Advanced',
        'AI Assistant (mini-you)': 'Unlimited + priority',
        'Ask ANY question': 'Yes',
        'Quiz Center': 'Yes',
        'Wrong-answer explanations': 'Deep',
        'Progress tracking': 'Real-time',
        'Topic mastery levels': 'Yes + confidence',
        'Strategic lessons': 'Advanced',
        'Solved examples': 'Unlimited',
        'Adaptive study plan': 'Yes',
        'Early feature access': 'Yes',
      }
    }
  ];

  const featureList = [
    'Upload documents',
    'Al-generated summaries',
    'AI Assistant (mini-you)',
    'Ask ANY question',
    'Quiz Center',
    'Wrong-answer explanations',
    'Progress tracking',
    'Topic mastery levels',
    'Strategic lessons',
    'Solved examples',
    'Adaptive study plan',
    'Early feature access'
  ];

  const CheckIcon = ({ color }: { color: string }) => (
    <svg className="w-5 h-5 mx-auto" fill="none" stroke={color} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  );

  const CrossIcon = () => (
    <svg className="w-5 h-5 mx-auto opacity-40" fill="none" stroke="#EF4444" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-[#1A1A1A] rounded-3xl border border-[#333] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-[#333] flex justify-between items-center bg-[#111]">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">Elevate Your Capacity</h2>
            <p className="text-[#666] text-xs font-bold uppercase tracking-widest mt-1">Syllabus-Grounded Intelligence</p>
          </div>
          <div className="flex items-center space-x-2 text-[#26BAA4] bg-[#26BAA4]/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#26BAA4]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#26BAA4] animate-pulse"></span>
            <span>Neural Engine: Online</span>
          </div>
        </div>
        
        <div className="overflow-x-auto bg-[#1A1A1A]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#333]">
                <th className="p-6 font-bold text-[#AAA] text-[10px] uppercase tracking-widest w-1/4">Feature Suite</th>
                {plans.map(plan => (
                  <th key={plan.name} className={`p-6 text-center ${currentPlan === plan.name ? 'bg-[#26BAA4]/5' : ''}`}>
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: plan.color }}></div>
                      <span className={`font-black text-sm uppercase tracking-tight ${currentPlan === plan.name ? 'text-[#26BAA4]' : 'text-white'}`}>
                        {plan.name}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
              <tr className="border-b border-[#333] bg-[#161616]">
                <td className="p-6 font-bold text-[10px] text-[#AAA] uppercase tracking-widest">Investment</td>
                {plans.map(plan => (
                  <td key={plan.name} className={`p-6 text-center ${currentPlan === plan.name ? 'bg-[#26BAA4]/5' : ''}`}>
                    <div className="text-xl font-black text-white">{plan.price} <span className="text-[10px] text-[#666] font-medium">{plan.period}</span></div>
                    {plan.yearly && <div className="text-[10px] text-[#AAA] mt-1 font-bold">{plan.yearly}</div>}
                  </td>
                ))}
              </tr>
            </thead>
            <tbody>
              {featureList.map((feature, idx) => (
                <tr key={feature} className={idx % 2 === 0 ? 'bg-transparent' : 'bg-[#161616]/50'}>
                  <td className="p-6 text-xs font-medium text-[#CCC] border-b border-[#222]">{feature}</td>
                  {plans.map(plan => {
                    const val = (plan.features as any)[feature];
                    return (
                      <td key={plan.name} className={`p-6 text-center text-xs border-b border-[#222] ${currentPlan === plan.name ? 'bg-[#26BAA4]/5' : ''}`}>
                        {val === 'Yes' || val === true ? <CheckIcon color={plan.color} /> : 
                         val === false ? <CrossIcon /> : 
                         <span className="font-bold flex flex-col items-center justify-center">
                           <div className="mb-1"><CheckIcon color={plan.color} /></div>
                           <span className="text-[9px] opacity-80 text-[#AAA] uppercase font-black">{val}</span>
                         </span>
                        }
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="grid grid-cols-4 border-t border-[#333] bg-[#111]">
          <div className="p-6"></div>
          {plans.map(plan => (
            <div key={plan.name} className={`p-6 flex justify-center ${currentPlan === plan.name ? 'bg-[#26BAA4]/5' : ''}`}>
              {currentPlan === plan.name ? (
                <div className="w-full py-4 rounded-xl border border-[#26BAA4] text-[#26BAA4] font-black text-[10px] uppercase tracking-widest flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                  <span>Active Plan</span>
                </div>
              ) : (
                <button 
                  onClick={() => onSelectPlan(plan.name)}
                  className="w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl"
                  style={{ backgroundColor: plan.color, color: 'white' }}
                >
                  {plan.name === 'Basic' ? 'Switch to Free' : 'Choose ' + plan.name}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionView;
