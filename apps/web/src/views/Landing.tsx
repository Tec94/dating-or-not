import { Link } from 'react-router-dom'
import { Fade, Zoom } from 'react-awesome-reveal'
import Page from '../components/Page'

export default function Landing() {
  return (
    <Page>
      <section className="text-center py-20">
        <Fade cascade damping={0.1}>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
            Date. <span className="text-brand-pink">Bet.</span> Win.
          </h1>
          <p className="mt-6 text-lg text-white/80 max-w-2xl mx-auto">
            Swipe like Tinder. Bet like DraftKings. All in one playful, privacy-first experience.
          </p>
        </Fade>
        <div className="mt-10 flex justify-center gap-4">
          <Zoom>
            <Link to="/home" className="px-6 py-3 rounded-full bg-brand-pink text-white font-semibold hover:opacity-90 pressable">Try Demo</Link>
          </Zoom>
          <Zoom delay={150}>
            <Link to="/dating" className="px-6 py-3 rounded-full glass font-semibold hover:opacity-90">Start Swiping</Link>
          </Zoom>
        </div>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          <Fade cascade damping={0.15}>
            <Feature title="Tinder-like Swipes" desc="Physics-based card deck for fast likes & passes" />
            <Feature title="Live Betting Odds" desc="FanDuel-style markets with instant payout calc" />
            <Feature title="Wallet & Tokens" desc="Deposit, withdraw, and track your winnings" />
          </Fade>
        </div>
      </section>
    </Page>
  )
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="glass rounded-2xl p-6 text-left">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-white/70 mt-2">{desc}</p>
    </div>
  )
}


