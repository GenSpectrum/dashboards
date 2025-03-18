import type { PathogenMegaMenuSection } from '../../../layouts/base/header/getPathogenMegaMenuSections';
import { iconMapping } from '../../iconCss';

type NavigationEntriesMapProps = {
    section: PathogenMegaMenuSection;
};

export function NavigationEntriesMap({ section }: NavigationEntriesMapProps) {
    return (
        <div className='group flex flex-wrap justify-center gap-2'>
            {section.navigationEntries.map((entry, idx) => {
                return (
                    <div key={idx} className={`card card-border w-96 shadow ${section.borderEntryDecoration}`}>
                        <a href={entry.href} className='card-body h-full'>
                            <div className='card-title'>
                                <h2 className={`iconify ${iconMapping[entry.iconType]}`} />
                                <div>{entry.label}</div>
                            </div>
                            <p>{entry.description}</p>
                            <div className='card-actions justify-end'>
                                <span className={`btn btn-soft ${section.headlineBackgroundColor}`}>
                                    Go to {entry.label}
                                </span>
                            </div>
                        </a>
                    </div>
                );
            })}
        </div>
    );
}
