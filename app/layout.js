import './globals.css';

export const metadata = {
  title: 'KANNUSAMY Agency | Operations Portal',
  description: 'IndianOil operations portal for Kallakurichi agency.',
  icons: { icon: '/indianoil-logo.webp' }
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
