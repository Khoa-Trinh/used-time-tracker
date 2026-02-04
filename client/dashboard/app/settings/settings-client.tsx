'use client';

import { ApiManagementSection } from '@/components/settings/ApiManagementSection';
import { DisplaySettings } from '@/components/settings/DisplaySettings';
import { Header } from '@/components/settings/Header';

export default function SettingsClient() {
    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans selection:bg-indigo-500/30">
            <div className="max-w-2xl mx-auto">
                <Header />

                <section className="mb-12">
                    <div className="mb-6">
                        <h2 className="text-lg font-medium text-white">Device Connections</h2>
                        <p className="text-sm text-zinc-500">Manage API keys for your trackers and extensions.</p>
                    </div>

                    <ApiManagementSection />
                </section>

                <section>
                    <div className="mb-6">
                        <h2 className="text-lg font-medium text-white">Interface Customization</h2>
                        <p className="text-sm text-zinc-500">Customize how your data is displayed.</p>
                    </div>

                    <DisplaySettings />
                </section>
            </div>
        </div>
    );
}

