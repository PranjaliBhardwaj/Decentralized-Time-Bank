import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { useEscrowReputation } from '../state/reputation'
import type { ProfileData } from '../lib/types'
import { AnimatedNumber } from '../components/AnimatedNumber'

const DEFAULT_PROFILE: ProfileData = {
  displayName: '',
  bio: '',
  contact: '',
  skills: [],
}

export default function ProfilePage() {
  const { address, isConnected } = useAccount()
  const { stats, history, loading } = useEscrowReputation(address)
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE)
  const [formName, setFormName] = useState('')
  const [formBio, setFormBio] = useState('')
  const [formContact, setFormContact] = useState('')
  const [skillsText, setSkillsText] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!address) {
      setProfile(DEFAULT_PROFILE)
      setFormName('')
      setFormBio('')
      setFormContact('')
      setSkillsText('')
      return
    }
    const stored = localStorage.getItem(profileKey(address))
    if (stored) {
      try {
        const parsed: ProfileData = JSON.parse(stored)
        setProfile(parsed)
        setFormName(parsed.displayName ?? '')
        setFormBio(parsed.bio ?? '')
        setFormContact(parsed.contact ?? '')
        setSkillsText(parsed.skills?.join(', ') ?? '')
      } catch {
        setProfile(DEFAULT_PROFILE)
      }
    } else {
      setProfile(DEFAULT_PROFILE)
      setFormName('')
      setFormBio('')
      setFormContact('')
      setSkillsText('')
    }
  }, [address])

  const handleSave = () => {
    if (!address) return
    const skills = skillsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const next: ProfileData = {
      displayName: formName,
      bio: formBio,
      contact: formContact,
      skills,
    }
    localStorage.setItem(profileKey(address), JSON.stringify(next))
    setProfile(next)
    setMessage('Profile saved locally')
    setTimeout(() => setMessage(null), 3000)
  }

  if (!isConnected) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Profile</h2>
        <div className="card text-neutral-400">Connect your wallet to view your profile and reputation.</div>
      </div>
    )
  }

  const displayName = profile.displayName || shorten(address!)
  const participantHistory = history.filter((item) => item.role !== 'observer')

  return (
    <div className="space-y-6 page-enter">
      <h2 className="text-2xl font-semibold animate-fade-in">Profile</h2>
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="card flex-1 space-y-2 animate-slide-in">
          <div className="text-sm text-neutral-400">Display Name</div>
          <div className="text-2xl font-semibold">{displayName}</div>
          <div className="text-sm text-neutral-500 break-all">{address}</div>
          <div className="text-sm text-neutral-400">
            Grade: <span className="text-white font-semibold text-indigo-400">{stats.grade}</span> · Score: <AnimatedNumber value={stats.score} />
          </div>
          <div className="text-sm text-neutral-400">
            Completed escrows: <AnimatedNumber value={stats.completed} /> · Cancelled: <AnimatedNumber value={stats.cancelled} />
          </div>
          <div className="text-sm text-neutral-400">
            Hours provided: <AnimatedNumber value={stats.hoursProvided} decimals={2} /> · Hours requested: <AnimatedNumber value={stats.hoursRequested} decimals={2} />
          </div>
          {profile.contact && (
            <div className="text-sm text-neutral-400">Contact: {profile.contact}</div>
          )}
          {profile.skills && profile.skills.length > 0 && (
            <div className="text-xs text-neutral-400">Skills: {profile.skills.join(', ')}</div>
          )}
          {profile.bio && <div className="text-sm text-neutral-300">{profile.bio}</div>}
        </div>
        <div className="card flex-1 space-y-3 animate-slide-in-right">
          <div className="text-sm text-neutral-400">Reputation Snapshot</div>
          {loading ? (
            <div className="text-neutral-400 text-sm animate-pulse-slow">Loading on-chain activity…</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Stat title="Created" value={stats.created} delay={0} />
              <Stat title="Completed" value={stats.completed} delay={100} />
              <Stat title="As requester" value={stats.asRequesterCompleted} subtitle="Completed services" delay={200} />
              <Stat title="As provider" value={stats.asProviderCompleted} subtitle="Completed gigs" delay={300} />
              <Stat title="Cancelled" value={stats.cancelled} delay={400} />
              <Stat title="Score" value={stats.score} subtitle="Performance rating" delay={500} />
            </div>
          )}
        </div>
      </div>

      <div className="card space-y-3">
        <div className="text-sm text-neutral-400">Profile Details (stored locally)</div>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm text-neutral-400">Display name</label>
            <input
              className="w-full bg-transparent border border-neutral-700 rounded px-3 py-2"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Your preferred name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-neutral-400">Contact</label>
            <input
              className="w-full bg-transparent border border-neutral-700 rounded px-3 py-2"
              value={formContact}
              onChange={(e) => setFormContact(e.target.value)}
              placeholder="Email or messaging handle"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-neutral-400">Bio</label>
          <textarea
            className="w-full bg-transparent border border-neutral-700 rounded px-3 py-2"
            rows={3}
            value={formBio}
            onChange={(e) => setFormBio(e.target.value)}
            placeholder="Share a short introduction and services you offer."
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-neutral-400">Skills (comma-separated)</label>
          <input
            className="w-full bg-transparent border border-neutral-700 rounded px-3 py-2"
            value={skillsText}
            onChange={(e) => setSkillsText(e.target.value)}
            placeholder="Design, Tutoring, Consulting"
          />
        </div>
        <button className="btn-primary" onClick={handleSave}>
          Save Profile
        </button>
        {message && <div className="text-xs text-green-400">{message}</div>}
      </div>

      <div className="card space-y-3 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="text-sm text-neutral-400">Recent escrows</div>
          <div className="text-xs text-neutral-500">
            Showing {Math.min(participantHistory.length, 5)} of {participantHistory.length}
          </div>
        </div>
        {participantHistory.length === 0 ? (
          <div className="text-sm text-neutral-400">No escrow activity yet.</div>
        ) : (
          <div className="space-y-2 text-sm">
            {participantHistory.slice(0, 5).map((item, idx) => (
              <div
                key={item.id}
                className="border border-neutral-800 rounded px-3 py-2 flex justify-between items-center hover:border-indigo-500 hover:bg-neutral-800/50 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div>
                  <div className="font-semibold text-neutral-200">Escrow #{item.id}</div>
                  <div className="text-xs text-neutral-400">
                    Role: {item.role} · Status: {item.status} · Hours: <AnimatedNumber value={item.hours} decimals={2} />
                  </div>
                </div>
                <div className="text-xs text-neutral-500">
                  Block: {item.completedBlock ? Number(item.completedBlock) : Number(item.createdBlock ?? 0n)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ title, value, subtitle, delay = 0 }: { title: string; value: number; subtitle?: string; delay?: number }) {
  return (
    <div
      className="border border-neutral-800 rounded px-3 py-2 hover:border-indigo-500 transition-all duration-300 animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="text-neutral-400 text-xs uppercase tracking-wide">{title}</div>
      <div className="text-white text-lg font-semibold">
        <AnimatedNumber value={value} />
      </div>
      {subtitle && <div className="text-neutral-500 text-xs">{subtitle}</div>}
    </div>
  )
}

function profileKey(address: string) {
  return `tb_profile_v1_${address.toLowerCase()}`
}

function shorten(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

