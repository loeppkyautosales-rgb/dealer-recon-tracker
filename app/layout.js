import '../styles/globals.css';

export const metadata = {
  title: 'Dealer Recon Board',
  description: 'Tracking and managing vehicle recon status',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
