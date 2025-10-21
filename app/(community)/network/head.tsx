export default function Head() {
    return (
        <>
            {/* Minimal critical CSS for network page above-the-fold (hero, header, tabs) */}
            <style>{`
        /* Network page critical CSS */
        .network-hero, .network-header, .network-tabs { box-sizing: border-box; }
        .network-hero { min-height: 160px; display:flex; align-items:center; justify-content:center; }
        .network-header h1 { font-size: 1.5rem; margin:0; }
        .network-tabs { display:flex; gap:0.5rem; align-items:center; }
        /* Basic layout container */
        .network-container { max-width: 1120px; margin: 0 auto; padding: 1rem; }
        /* Sticky tab placeholder */
        .sticky-placeholder { height: 48px; }
      `}</style>
        </>
    );
}
