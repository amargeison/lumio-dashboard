// The coach's bookshelf — real, published books worth a player's or parent's
// time, with a line on who each one is for and why.
//
// These are actual works by actual authors, quoted and credited. They are not
// Lumio content and are not sold here: the Resource Centre points at them the
// way a coach points at a shelf, and the "why" is the coach's reason for
// handing it over, which is the only part that makes a recommendation useful.
//
// Lumio's OWN written material — the parent guides, the cheat sheets, the
// reading notes — lives in the Resource Centre under Guides. Filing it as
// "Books" was what made the Books tab look like a folder of worksheets.

export type BookTopic = 'Mental' | 'Tactics' | 'Memoir' | 'Development' | 'Fitness'

export type Book = {
  id: string
  title: string
  author: string
  topic: BookTopic
  /** Who it actually suits — a nine-year-old and their parent want different books. */
  audience: string
  year: number
  /** The coach's reason for recommending it, in their voice. */
  why: string
  /** Spine colour for the cover block. */
  spine: string
}

export const BOOKS: Book[] = [
  { id: 'b1', title: 'The Inner Game of Tennis', author: 'W. Timothy Gallwey', topic: 'Mental', audience: 'All players', year: 1974, spine: '#7c5cbf', why: 'The classic. Quiet the mind, trust your strokes — I give this to anyone who overthinks on court.' },
  { id: 'b2', title: 'Winning Ugly', author: 'Brad Gilbert', topic: 'Tactics', audience: 'Teen & adult', year: 1993, spine: '#3A8EE0', why: 'Match-play street smarts: how to win when you’re not at your best, and how to beat better players.' },
  { id: 'b3', title: 'Open', author: 'Andre Agassi', topic: 'Memoir', audience: 'Teen & adult', year: 2009, spine: '#C75A5A', why: 'A brutally honest autobiography — brilliant for perspective and motivation when the grind feels hard.' },
  { id: 'b4', title: 'Mindset', author: 'Carol S. Dweck', topic: 'Development', audience: 'Parents & juniors', year: 2006, spine: '#4FAE72', why: 'Growth vs fixed mindset. Essential reading for parents supporting a young player.' },
  { id: 'b5', title: 'The Talent Code', author: 'Daniel Coyle', topic: 'Development', audience: 'Parents & coaches', year: 2009, spine: '#E08A3C', why: 'Why deep practice grows skill. Helps players understand why we drill the way we do.' },
  { id: 'b6', title: 'The Champion’s Mind', author: 'Jim Afremow', topic: 'Mental', audience: 'Teen & adult', year: 2013, spine: '#8B5CF6', why: 'Practical sports-psychology routines for competing and handling pressure.' },
  { id: 'b7', title: 'Bounce', author: 'Matthew Syed', topic: 'Development', audience: 'Older juniors & parents', year: 2010, spine: '#0EA5A4', why: 'Myth-busting on talent and practice — an easy, inspiring read for motivated juniors.' },
  { id: 'b8', title: 'With Winning in Mind', author: 'Lanny Bassham', topic: 'Mental', audience: 'Tournament players', year: 1988, spine: '#C9A227', why: 'A mental-management system used by Olympians — ideal once a player is competing regularly.' },
]

export const BOOK_TOPICS: BookTopic[] = ['Mental', 'Tactics', 'Development', 'Memoir']

export const bookById = (id: string): Book | undefined => BOOKS.find(b => b.id === id)
