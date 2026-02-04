'use client';

interface AuthToggleProps {
    isSignUp: boolean;
    onToggle: () => void;
}

export function AuthToggle({ isSignUp, onToggle }: AuthToggleProps) {
    return (
        <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <button
                onClick={onToggle}
                className="text-sm text-zinc-500 hover:text-white transition-colors duration-200 focus:outline-none focus:text-indigo-400 group"
            >
                {isSignUp ? (
                    <span>Already have an account? <span className="text-indigo-400 underline-offset-4 group-hover:underline">Sign In</span></span>
                ) : (
                    <span>Don't have an account? <span className="text-indigo-400 underline-offset-4 group-hover:underline">Sign Up</span></span>
                )}
            </button>
        </div>
    );
}

