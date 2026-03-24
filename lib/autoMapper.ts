import type { MappingTarget } from '@/types'

/** Pattern-based auto-suggestion for column→target mapping */
const PATTERNS: [RegExp, MappingTarget][] = [
  [/\bemail\b/i, 'Email'],
  [/\be[-_]?mail\b/i, 'Email'],
  [/\bfirst[-_\s]?name\b/i, 'First Name'],
  [/\bgiven[-_\s]?name\b/i, 'First Name'],
  [/\blast[-_\s]?name\b/i, 'Last Name'],
  [/\bsurname\b/i, 'Last Name'],
  [/\bfamily[-_\s]?name\b/i, 'Last Name'],
  [/\bfull[-_\s]?name\b/i, 'Full Name / Booking Name'],
  [/\bbooking[-_\s]?name\b/i, 'Full Name / Booking Name'],
  [/\bguest[-_\s]?name\b/i, 'Full Name / Booking Name'],
  [/\bname\b/i, 'Full Name / Booking Name'],
  [/\bcompany\b/i, 'Company Name'],
  [/\borganis?ation\b/i, 'Company Name'],
  [/\bcorp\b/i, 'Company Name'],
  [/\btitle\b/i, 'Title/Salutation'],
  [/\bsalutation\b/i, 'Title/Salutation'],
  [/\bprefix\b/i, 'Title/Salutation'],
  [/\bphone\b/i, 'Phone/Cell'],
  [/\bcell\b/i, 'Phone/Cell'],
  [/\bmobile\b/i, 'Phone/Cell'],
  [/\btel\b/i, 'Phone/Cell'],
  [/\bcontact[-_\s]?no\b/i, 'Phone/Cell'],
  [/\bdob\b/i, 'Date of Birth'],
  [/\bdate[-_\s]?of[-_\s]?birth\b/i, 'Date of Birth'],
  [/\bbirth[-_\s]?date\b/i, 'Date of Birth'],
  [/\bid[-_\s]?num/i, 'ID Number'],
  [/\bpassport\b/i, 'ID Number'],
  [/\bnational[-_\s]?id\b/i, 'ID Number'],
  [/\bidentity\b/i, 'ID Number'],
]

export function suggestMapping(header: string): MappingTarget | null {
  const h = header.trim()
  for (const [pattern, target] of PATTERNS) {
    if (pattern.test(h)) return target
  }
  return null
}
