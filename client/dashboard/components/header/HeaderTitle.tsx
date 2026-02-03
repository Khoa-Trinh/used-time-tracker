import { memo } from 'react';
import { Zap } from 'lucide-react';

const HeaderTitle = memo(function HeaderTitle() {
    return (
        <div className="flex items-center gap-4">
            <div className="relative group">
                <div className="absolute inset-0 bg-blue-500/20 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300 opacity-70" />
                <div className="relative h-12 w-12 rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-white/10 group-hover:scale-105 transition-transform duration-300">
                    <Zap className="h-6 w-6 text-white" strokeWidth={2.5} />
                </div>
            </div>

            <div className="flex flex-col">
                <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    Tick
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-bold uppercase tracking-wider border border-blue-500/20">
                        Beta
                    </span>
                </h1>
                <p className="text-muted-foreground text-xs font-medium tracking-wide">
                    Time Tracker
                </p>
            </div>
        </div>
    );
});

export default HeaderTitle;
