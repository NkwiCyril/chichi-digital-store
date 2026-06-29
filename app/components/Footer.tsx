const footerLinks: Record<string, string[]> = {
  Product: ["Features", "Pricing", "Changelog", "Roadmap"],
  Company: ["About", "Blog", "Careers", "Press"],
  Support: ["Documentation", "Help Center", "API Reference", "Status"],
  Legal: ["Privacy", "Terms", "Cookies", "Licenses"],
};

export default function Footer() {
  return (
    <footer className="bg-zinc-900 text-zinc-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1L15 4.5V11.5L8 15L1 11.5V4.5L8 1Z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-white">Chichi</span>
            </div>
            <p className="text-sm text-zinc-500 leading-relaxed">
              The simplest way for creators to sell digital products online.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-4">
                {category}
              </p>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-zinc-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">© 2025 Chichi, Inc. All rights reserved.</p>
          <div className="flex items-center gap-5">
            {["Twitter", "GitHub", "LinkedIn"].map((social) => (
              <a
                key={social}
                href="#"
                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                {social}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
