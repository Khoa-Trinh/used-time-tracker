import { memo } from 'react';
import HeaderTitle from './header/HeaderTitle';
import HeaderActions from './header/HeaderActions';

const DashboardHeader = memo(function DashboardHeader() {
    return (
        <header className="flex items-center justify-between pb-6 border-b border-border">
            <HeaderTitle />
            <HeaderActions />
        </header>
    );
});

export default DashboardHeader;
