import { FinexySidebar } from './FinexySidebar';
import './finexy.css';

export default function FinexyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fx-page">
      <FinexySidebar />
      <main className="fx-main">
        {children}
      </main>
    </div>
  );
}
