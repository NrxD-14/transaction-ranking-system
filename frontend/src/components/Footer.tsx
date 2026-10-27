/** Global footer — ownership and version. */
import { FOOTER_TEXT } from '../constants/app';

export function Footer() {
  return (
    <footer className="py-4 text-center border-t border-[#E5E7EB] dark:border-white/10 mt-auto">
      <p className="text-[11px] text-gray-400 dark:text-gray-500">{FOOTER_TEXT}</p>
    </footer>
  );
}
