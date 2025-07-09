import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Award, 
  Zap, 
  Trophy, 
  History,
  Info,
  RefreshCw,
  Star,
  ArrowRight,
  Coins,
  AlertCircle
} from 'lucide-react'
import ReactConfetti from 'react-confetti'
import { useAuth } from '../contexts/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import toast from 'react-hot-toast'

// Import custom icon components
import Globe from '../components/Globe'
import Tv from '../components/Tv'
import Play from '../components/Play'

interface Question {
  id: string
  text: string
  options: string[]
  correctAnswer: number
}

interface QuizCategory {
  id: string
  name: string
  icon: React.ComponentType<any>
  color: string
}

interface QuizDifficulty {
  id: string
  name: string
  pointsPerQuestion: number
  color: string
  icon: string
}

interface QuizResult {
  score: number
  totalQuestions: number
  correctAnswers: number
  timeTaken: number
  category: string
  difficulty: string
}

interface QuizHistory {
  id: string
  user_id: string
  score: number
  total_questions: number
  correct_answers: number
  time_taken: number
  category?: string
  difficulty?: string
  created_at: string
}

const TriviaQuizPage: React.FC = () => {
  const { user, userProfile, refreshProfile } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null)
  const [quizStarted, setQuizStarted] = useState(false)
  const [quizFinished, setQuizFinished] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null)
  const [score, setScore] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [timeLeft, setTimeLeft] = useState(15)
  const [quizStartTime, setQuizStartTime] = useState(0)
  const [quizEndTime, setQuizEndTime] = useState(0)
  const [quizHistory, setQuizHistory] = useState<QuizHistory[]>([])
  const [quizzesRemaining, setQuizzesRemaining] = useState(3)
  const [loading, setLoading] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [showTutorial, setShowTutorial] = useState(false)
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Quiz categories
  const categories: QuizCategory[] = [
    { id: 'all', name: 'All Categories', icon: Globe, color: 'from-blue-400 to-blue-600' },
    { id: 'general', name: 'General Knowledge', icon: Globe, color: 'from-purple-400 to-purple-600' },
    { id: 'science', name: 'Science & Tech', icon: Zap, color: 'from-green-400 to-green-600' },
    { id: 'history', name: 'History', icon: Clock, color: 'from-yellow-400 to-yellow-600' },
    { id: 'geography', name: 'Geography', icon: Globe, color: 'from-blue-400 to-blue-600' },
    { id: 'entertainment', name: 'Entertainment', icon: Tv, color: 'from-pink-400 to-pink-600' },
    { id: 'sports', name: 'Sports', icon: Trophy, color: 'from-orange-400 to-orange-600' },
    { id: 'wwe', name: 'WWE Wrestling', icon: Trophy, color: 'from-red-400 to-red-600' }
  ]

  // Quiz difficulties
  const difficulties: QuizDifficulty[] = [
    { id: 'easy', name: 'Easy', pointsPerQuestion: 10, color: 'from-green-400 to-green-600', icon: '⭐' },
    { id: 'medium', name: 'Medium', pointsPerQuestion: 20, color: 'from-yellow-400 to-yellow-600', icon: '⭐⭐' },
    { id: 'hard', name: 'Hard', pointsPerQuestion: 30, color: 'from-red-400 to-red-600', icon: '⭐⭐⭐' }
  ]

  // Quiz questions database
  const questionsDatabase: Record<string, Record<string, Question[]>> = {
    general: {
      easy: [
        {
          id: 'gen_easy_1',
          text: 'What is the capital of France?',
          options: ['London', 'Berlin', 'Paris', 'Madrid'],
          correctAnswer: 2
        },
        {
          id: 'gen_easy_2',
          text: 'Which planet is known as the Red Planet?',
          options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
          correctAnswer: 1
        },
        {
          id: 'gen_easy_3',
          text: 'What is the largest ocean on Earth?',
          options: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'],
          correctAnswer: 3
        },
        {
          id: 'gen_easy_4',
          text: 'How many continents are there in the world?',
          options: ['5', '6', '7', '8'],
          correctAnswer: 2
        },
        {
          id: 'gen_easy_5',
          text: 'Which of these is not a primary color?',
          options: ['Red', 'Blue', 'Green', 'Yellow'],
          correctAnswer: 3
        },
        {
          id: 'gen_easy_6',
          text: 'What is the chemical symbol for gold?',
          options: ['Go', 'Gd', 'Au', 'Ag'],
          correctAnswer: 2
        },
        {
          id: 'gen_easy_7',
          text: 'Which animal is known as the "King of the Jungle"?',
          options: ['Tiger', 'Lion', 'Elephant', 'Gorilla'],
          correctAnswer: 1
        },
        {
          id: 'gen_easy_8',
          text: 'How many sides does a hexagon have?',
          options: ['5', '6', '7', '8'],
          correctAnswer: 1
        },
        {
          id: 'gen_easy_9',
          text: 'What is the largest mammal in the world?',
          options: ['Elephant', 'Blue Whale', 'Giraffe', 'Polar Bear'],
          correctAnswer: 1
        },
        {
          id: 'gen_easy_10',
          text: 'Which country is known as the Land of the Rising Sun?',
          options: ['China', 'Thailand', 'South Korea', 'Japan'],
          correctAnswer: 3
        },
        {
          id: 'gen_easy_11',
          text: 'What is the smallest prime number?',
          options: ['0', '1', '2', '3'],
          correctAnswer: 2
        },
        {
          id: 'gen_easy_12',
          text: 'Which gas do plants absorb from the atmosphere?',
          options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'],
          correctAnswer: 2
        }
      ],
      medium: [
        {
          id: 'gen_med_1',
          text: 'Who painted the Mona Lisa?',
          options: ['Vincent van Gogh', 'Pablo Picasso', 'Leonardo da Vinci', 'Michelangelo'],
          correctAnswer: 2
        },
        {
          id: 'gen_med_2',
          text: 'What is the chemical symbol for silver?',
          options: ['Si', 'Sv', 'Ag', 'Sr'],
          correctAnswer: 2
        },
        {
          id: 'gen_med_3',
          text: 'Which element has the atomic number 1?',
          options: ['Helium', 'Hydrogen', 'Oxygen', 'Carbon'],
          correctAnswer: 1
        },
        {
          id: 'gen_med_4',
          text: 'In which year did World War II end?',
          options: ['1943', '1945', '1947', '1950'],
          correctAnswer: 1
        },
        {
          id: 'gen_med_5',
          text: 'What is the capital of Australia?',
          options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'],
          correctAnswer: 2
        },
        {
          id: 'gen_med_6',
          text: 'Which of these is not a noble gas?',
          options: ['Helium', 'Neon', 'Argon', 'Nitrogen'],
          correctAnswer: 3
        },
        {
          id: 'gen_med_7',
          text: 'Who wrote "Romeo and Juliet"?',
          options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'],
          correctAnswer: 1
        },
        {
          id: 'gen_med_8',
          text: 'What is the largest organ in the human body?',
          options: ['Heart', 'Liver', 'Brain', 'Skin'],
          correctAnswer: 3
        }
      ],
      hard: [
        {
          id: 'gen_hard_1',
          text: 'What is the rarest blood type in humans?',
          options: ['O negative', 'AB negative', 'B negative', 'A negative'],
          correctAnswer: 1
        },
        {
          id: 'gen_hard_2',
          text: 'Who was the first woman to win a Nobel Prize?',
          options: ['Marie Curie', 'Rosalind Franklin', 'Dorothy Hodgkin', 'Irène Joliot-Curie'],
          correctAnswer: 0
        },
        {
          id: 'gen_hard_3',
          text: 'What is the smallest bone in the human body?',
          options: ['Stapes', 'Femur', 'Radius', 'Phalanges'],
          correctAnswer: 0
        },
        {
          id: 'gen_hard_4',
          text: 'Which country has the most islands in the world?',
          options: ['Indonesia', 'Philippines', 'Sweden', 'Norway'],
          correctAnswer: 2
        },
        {
          id: 'gen_hard_5',
          text: 'What is the hardest natural substance on Earth?',
          options: ['Titanium', 'Diamond', 'Platinum', 'Graphene'],
          correctAnswer: 1
        },
        {
          id: 'gen_hard_6',
          text: 'In what year was the first iPhone released?',
          options: ['2005', '2006', '2007', '2008'],
          correctAnswer: 2
        }
      ]
    },
    science: {
      easy: [
        {
          id: 'sci_easy_1',
          text: 'What is the chemical symbol for water?',
          options: ['WA', 'H2O', 'W', 'HO'],
          correctAnswer: 1
        },
        {
          id: 'sci_easy_2',
          text: 'Which planet is closest to the Sun?',
          options: ['Venus', 'Earth', 'Mars', 'Mercury'],
          correctAnswer: 3
        },
        {
          id: 'sci_easy_3',
          text: 'What is the largest organ in the human body?',
          options: ['Heart', 'Liver', 'Skin', 'Brain'],
          correctAnswer: 2
        },
        {
          id: 'sci_easy_4',
          text: 'What is the hardest natural substance on Earth?',
          options: ['Iron', 'Diamond', 'Platinum', 'Gold'],
          correctAnswer: 1
        },
        {
          id: 'sci_easy_5',
          text: 'Which gas do plants absorb from the atmosphere?',
          options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Hydrogen'],
          correctAnswer: 1
        },
        {
          id: 'sci_easy_6',
          text: 'What is the center of an atom called?',
          options: ['Nucleus', 'Proton', 'Neutron', 'Electron'],
          correctAnswer: 0
        },
        {
          id: 'sci_easy_7',
          text: 'Which of these is not a state of matter?',
          options: ['Solid', 'Liquid', 'Gas', 'Energy'],
          correctAnswer: 3
        },
        {
          id: 'sci_easy_8',
          text: 'What is the main gas found in the air we breathe?',
          options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Hydrogen'],
          correctAnswer: 2
        }
      ],
      medium: [
        {
          id: 'sci_med_1',
          text: 'What is the chemical symbol for gold?',
          options: ['Go', 'Gd', 'Au', 'Ag'],
          correctAnswer: 2
        },
        {
          id: 'sci_med_2',
          text: 'Which planet has the most moons?',
          options: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'],
          correctAnswer: 1
        },
        {
          id: 'sci_med_3',
          text: 'What is the speed of light in a vacuum?',
          options: ['300,000 km/s', '150,000 km/s', '200,000 km/s', '250,000 km/s'],
          correctAnswer: 0
        },
        {
          id: 'sci_med_4',
          text: 'What is the smallest unit of life?',
          options: ['Atom', 'Cell', 'Molecule', 'Tissue'],
          correctAnswer: 1
        },
        {
          id: 'sci_med_5',
          text: 'Which element has the chemical symbol "Fe"?',
          options: ['Iron', 'Fluorine', 'Francium', 'Fermium'],
          correctAnswer: 0
        },
        {
          id: 'sci_med_6',
          text: 'What is the process by which plants make their own food?',
          options: ['Respiration', 'Photosynthesis', 'Fermentation', 'Digestion'],
          correctAnswer: 1
        }
      ],
      hard: [
        {
          id: 'sci_hard_1',
          text: 'What is the half-life of Carbon-14?',
          options: ['2,500 years', '5,730 years', '10,000 years', '14,500 years'],
          correctAnswer: 1
        },
        {
          id: 'sci_hard_2',
          text: 'Which subatomic particle is found in the nucleus and has no charge?',
          options: ['Proton', 'Electron', 'Neutron', 'Positron'],
          correctAnswer: 2
        },
        {
          id: 'sci_hard_3',
          text: 'What is the most abundant element in the universe?',
          options: ['Oxygen', 'Carbon', 'Helium', 'Hydrogen'],
          correctAnswer: 3
        },
        {
          id: 'sci_hard_4',
          text: 'Which of these is not one of the four fundamental forces?',
          options: ['Gravity', 'Electromagnetic', 'Strong Nuclear', 'Centrifugal'],
          correctAnswer: 3
        },
        {
          id: 'sci_hard_5',
          text: 'What is the name of the closest galaxy to the Milky Way?',
          options: ['Andromeda', 'Triangulum', 'Canis Major Dwarf', 'Large Magellanic Cloud'],
          correctAnswer: 0
        }
      ]
    },
    history: {
      easy: [
        {
          id: 'hist_easy_1',
          text: 'Who was the first President of the United States?',
          options: ['Thomas Jefferson', 'George Washington', 'Abraham Lincoln', 'John Adams'],
          correctAnswer: 1
        },
        {
          id: 'hist_easy_2',
          text: 'In which year did World War II end?',
          options: ['1943', '1945', '1947', '1950'],
          correctAnswer: 1
        },
        {
          id: 'hist_easy_3',
          text: 'Which ancient civilization built the pyramids?',
          options: ['Romans', 'Greeks', 'Egyptians', 'Mayans'],
          correctAnswer: 2
        },
        {
          id: 'hist_easy_4',
          text: 'Who painted the Mona Lisa?',
          options: ['Vincent van Gogh', 'Leonardo da Vinci', 'Pablo Picasso', 'Michelangelo'],
          correctAnswer: 1
        },
        {
          id: 'hist_easy_5',
          text: 'Which country was the first to send a human to space?',
          options: ['United States', 'Soviet Union (Russia)', 'China', 'United Kingdom'],
          correctAnswer: 1
        },
        {
          id: 'hist_easy_6',
          text: 'In which year did the Titanic sink?',
          options: ['1910', '1912', '1915', '1918'],
          correctAnswer: 1
        },
        {
          id: 'hist_easy_7',
          text: 'Who was the first woman to fly solo across the Atlantic Ocean?',
          options: ['Amelia Earhart', 'Bessie Coleman', 'Harriet Quimby', 'Jacqueline Cochran'],
          correctAnswer: 0
        }
      ],
      medium: [
        {
          id: 'hist_med_1',
          text: 'In which year did the Berlin Wall fall?',
          options: ['1987', '1989', '1991', '1993'],
          correctAnswer: 1
        },
        {
          id: 'hist_med_2',
          text: 'Who was the first Emperor of Rome?',
          options: ['Julius Caesar', 'Augustus', 'Nero', 'Constantine'],
          correctAnswer: 1
        },
        {
          id: 'hist_med_3',
          text: 'Which treaty ended World War I?',
          options: ['Treaty of Paris', 'Treaty of Versailles', 'Treaty of London', 'Treaty of Rome'],
          correctAnswer: 1
        },
        {
          id: 'hist_med_4',
          text: 'Who was the leader of the Soviet Union during the Cuban Missile Crisis?',
          options: ['Joseph Stalin', 'Vladimir Lenin', 'Nikita Khrushchev', 'Leonid Brezhnev'],
          correctAnswer: 2
        },
        {
          id: 'hist_med_5',
          text: 'Which civilization created the Machu Picchu complex in Peru?',
          options: ['Aztec', 'Inca', 'Maya', 'Olmec'],
          correctAnswer: 1
        }
      ],
      hard: [
        {
          id: 'hist_hard_1',
          text: 'Who was the last Tsar of Russia?',
          options: ['Nicholas II', 'Alexander III', 'Peter the Great', 'Ivan the Terrible'],
          correctAnswer: 0
        },
        {
          id: 'hist_hard_2',
          text: 'Which battle in 1815 marked the final defeat of Napoleon Bonaparte?',
          options: ['Battle of Austerlitz', 'Battle of Trafalgar', 'Battle of Waterloo', 'Battle of Borodino'],
          correctAnswer: 2
        },
        {
          id: 'hist_hard_3',
          text: 'Who was the first female Prime Minister of the United Kingdom?',
          options: ['Theresa May', 'Margaret Thatcher', 'Queen Victoria', 'Queen Elizabeth II'],
          correctAnswer: 1
        },
        {
          id: 'hist_hard_4',
          text: 'In which year did the Chernobyl nuclear disaster occur?',
          options: ['1984', '1986', '1989', '1991'],
          correctAnswer: 1
        },
        {
          id: 'hist_hard_5',
          text: 'Which ancient city was destroyed by Mount Vesuvius in 79 AD?',
          options: ['Athens', 'Rome', 'Pompeii', 'Alexandria'],
          correctAnswer: 2
        }
      ]
    },
    geography: {
      easy: [
        {
          id: 'geo_easy_1',
          text: 'What is the capital of Japan?',
          options: ['Beijing', 'Seoul', 'Tokyo', 'Bangkok'],
          correctAnswer: 2
        },
        {
          id: 'geo_easy_2',
          text: 'Which is the largest ocean on Earth?',
          options: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'],
          correctAnswer: 3
        },
        {
          id: 'geo_easy_3',
          text: 'Which country is known as the Land of the Rising Sun?',
          options: ['China', 'South Korea', 'Thailand', 'Japan'],
          correctAnswer: 3
        },
        {
          id: 'geo_easy_4',
          text: 'What is the capital of Australia?',
          options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'],
          correctAnswer: 2
        },
        {
          id: 'geo_easy_5',
          text: 'Which is the longest river in the world?',
          options: ['Amazon', 'Nile', 'Mississippi', 'Yangtze'],
          correctAnswer: 1
        },
        {
          id: 'geo_easy_6',
          text: 'Which continent is the largest by land area?',
          options: ['North America', 'Africa', 'Europe', 'Asia'],
          correctAnswer: 3
        },
        {
          id: 'geo_easy_7',
          text: 'What is the capital of Canada?',
          options: ['Toronto', 'Vancouver', 'Montreal', 'Ottawa'],
          correctAnswer: 3
        }
      ],
      medium: [
        {
          id: 'geo_med_1',
          text: 'Which country has the most natural lakes?',
          options: ['United States', 'Russia', 'Canada', 'Finland'],
          correctAnswer: 2
        },
        {
          id: 'geo_med_2',
          text: 'What is the capital of Argentina?',
          options: ['Santiago', 'Lima', 'Buenos Aires', 'Montevideo'],
          correctAnswer: 2
        },
        {
          id: 'geo_med_3',
          text: 'Which mountain range separates Europe and Asia?',
          options: ['Alps', 'Himalayas', 'Andes', 'Ural Mountains'],
          correctAnswer: 3
        },
        {
          id: 'geo_med_4',
          text: 'Which African country was formerly known as Abyssinia?',
          options: ['Egypt', 'Ethiopia', 'Nigeria', 'Kenya'],
          correctAnswer: 1
        },
        {
          id: 'geo_med_5',
          text: 'What is the largest desert in the world?',
          options: ['Gobi Desert', 'Kalahari Desert', 'Sahara Desert', 'Antarctic Desert'],
          correctAnswer: 3
        }
      ],
      hard: [
        {
          id: 'geo_hard_1',
          text: 'Which country has the most time zones?',
          options: ['Russia', 'United States', 'France', 'Australia'],
          correctAnswer: 2
        },
        {
          id: 'geo_hard_2',
          text: 'What is the capital of Burkina Faso?',
          options: ['Ouagadougou', 'Bamako', 'Niamey', 'Dakar'],
          correctAnswer: 0
        },
        {
          id: 'geo_hard_3',
          text: 'Which country is completely surrounded by South Africa?',
          options: ['Namibia', 'Botswana', 'Lesotho', 'Zimbabwe'],
          correctAnswer: 2
        },
        {
          id: 'geo_hard_4',
          text: 'What is the smallest independent country in the world?',
          options: ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'],
          correctAnswer: 1
        },
        {
          id: 'geo_hard_5',
          text: 'Which strait separates Asia from North America?',
          options: ['Strait of Gibraltar', 'Strait of Malacca', 'Bering Strait', 'Strait of Hormuz'],
          correctAnswer: 2
        }
      ]
    },
    entertainment: {
      easy: [
        {
          id: 'ent_easy_1',
          text: 'Who played Iron Man in the Marvel Cinematic Universe?',
          options: ['Chris Evans', 'Chris Hemsworth', 'Robert Downey Jr.', 'Mark Ruffalo'],
          correctAnswer: 2
        },
        {
          id: 'ent_easy_2',
          text: 'Which band performed the song "Bohemian Rhapsody"?',
          options: ['The Beatles', 'Queen', 'Led Zeppelin', 'The Rolling Stones'],
          correctAnswer: 1
        },
        {
          id: 'ent_easy_3',
          text: 'What was the first feature-length animated movie ever released?',
          options: ['Pinocchio', 'Snow White and the Seven Dwarfs', 'Fantasia', 'Bambi'],
          correctAnswer: 1
        },
        {
          id: 'ent_easy_4',
          text: 'Which TV show features characters named Ross, Rachel, Monica, Chandler, Joey, and Phoebe?',
          options: ['How I Met Your Mother', 'The Big Bang Theory', 'Friends', 'Seinfeld'],
          correctAnswer: 2
        },
        {
          id: 'ent_easy_5',
          text: 'Who is the author of the Harry Potter book series?',
          options: ['J.R.R. Tolkien', 'J.K. Rowling', 'Stephen King', 'George R.R. Martin'],
          correctAnswer: 1
        },
        {
          id: 'ent_easy_6',
          text: 'Which movie features a character named Forrest Gump?',
          options: ['The Shawshank Redemption', 'Pulp Fiction', 'Forrest Gump', 'The Green Mile'],
          correctAnswer: 2
        }
      ],
      medium: [
        {
          id: 'ent_med_1',
          text: 'Who directed the movie "Inception"?',
          options: ['Steven Spielberg', 'Christopher Nolan', 'James Cameron', 'Quentin Tarantino'],
          correctAnswer: 1
        },
        {
          id: 'ent_med_2',
          text: 'Which actor played the Joker in "The Dark Knight"?',
          options: ['Joaquin Phoenix', 'Jack Nicholson', 'Jared Leto', 'Heath Ledger'],
          correctAnswer: 3
        },
        {
          id: 'ent_med_3',
          text: 'Which band released the album "Abbey Road"?',
          options: ['The Rolling Stones', 'The Beatles', 'Pink Floyd', 'Led Zeppelin'],
          correctAnswer: 1
        },
        {
          id: 'ent_med_4',
          text: 'Who wrote the novel "Pride and Prejudice"?',
          options: ['Jane Austen', 'Charlotte Brontë', 'Emily Brontë', 'Virginia Woolf'],
          correctAnswer: 0
        },
        {
          id: 'ent_med_5',
          text: 'Which TV show is set in the fictional town of Hawkins, Indiana?',
          options: ['The Walking Dead', 'Stranger Things', 'Riverdale', 'Twin Peaks'],
          correctAnswer: 1
        }
      ],
      hard: [
        {
          id: 'ent_hard_1',
          text: 'Which film won the Academy Award for Best Picture in 2020?',
          options: ['1917', 'Joker', 'Parasite', 'Once Upon a Time in Hollywood'],
          correctAnswer: 2
        },
        {
          id: 'ent_hard_2',
          text: 'Who composed the opera "The Marriage of Figaro"?',
          options: ['Ludwig van Beethoven', 'Wolfgang Amadeus Mozart', 'Johann Sebastian Bach', 'Giuseppe Verdi'],
          correctAnswer: 1
        },
        {
          id: 'ent_hard_3',
          text: 'Which actor has won the most Academy Awards for Best Actor?',
          options: ['Jack Nicholson', 'Daniel Day-Lewis', 'Marlon Brando', 'Tom Hanks'],
          correctAnswer: 1
        },
        {
          id: 'ent_hard_4',
          text: 'Which director is known for films such as "Pulp Fiction" and "Django Unchained"?',
          options: ['Martin Scorsese', 'Quentin Tarantino', 'Steven Spielberg', 'Christopher Nolan'],
          correctAnswer: 1
        },
        {
          id: 'ent_hard_5',
          text: 'Which band released the album "Dark Side of the Moon"?',
          options: ['Led Zeppelin', 'The Rolling Stones', 'Pink Floyd', 'The Who'],
          correctAnswer: 2
        }
      ]
    },
    sports: {
      easy: [
        {
          id: 'sports_easy_1',
          text: 'In which sport would you perform a slam dunk?',
          options: ['Football', 'Basketball', 'Tennis', 'Golf'],
          correctAnswer: 1
        },
        {
          id: 'sports_easy_2',
          text: 'How many players are there in a standard soccer team on the field?',
          options: ['9', '10', '11', '12'],
          correctAnswer: 2
        },
        {
          id: 'sports_easy_3',
          text: 'Which country won the FIFA World Cup in 2018?',
          options: ['Brazil', 'Germany', 'Argentina', 'France'],
          correctAnswer: 3
        },
        {
          id: 'sports_easy_4',
          text: 'In which sport would you use a racket?',
          options: ['Swimming', 'Boxing', 'Tennis', 'Soccer'],
          correctAnswer: 2
        },
        {
          id: 'sports_easy_5',
          text: 'How many rings are on the Olympic flag?',
          options: ['4', '5', '6', '7'],
          correctAnswer: 1
        },
        {
          id: 'sports_easy_6',
          text: 'Which sport is played at Wimbledon?',
          options: ['Golf', 'Cricket', 'Tennis', 'Rugby'],
          correctAnswer: 2
        },
        {
          id: 'sports_easy_7',
          text: 'In which sport would you perform a "hole in one"?',
          options: ['Golf', 'Bowling', 'Pool', 'Archery'],
          correctAnswer: 0
        }
      ],
      medium: [
        {
          id: 'sports_med_1',
          text: 'Which country has won the most Olympic gold medals?',
          options: ['Russia', 'China', 'United States', 'Germany'],
          correctAnswer: 2
        },
        {
          id: 'sports_med_2',
          text: 'In which year were the first modern Olympic Games held?',
          options: ['1886', '1896', '1906', '1916'],
          correctAnswer: 1
        },
        {
          id: 'sports_med_3',
          text: 'Which team has won the most Super Bowls?',
          options: ['Dallas Cowboys', 'New England Patriots', 'Pittsburgh Steelers', 'San Francisco 49ers'],
          correctAnswer: 1
        },
        {
          id: 'sports_med_4',
          text: 'Who holds the record for the most Grand Slam tennis titles?',
          options: ['Roger Federer', 'Rafael Nadal', 'Novak Djokovic', 'Serena Williams'],
          correctAnswer: 2
        },
        {
          id: 'sports_med_5',
          text: 'Which country invented basketball?',
          options: ['United States', 'Canada', 'England', 'France'],
          correctAnswer: 1
        }
      ],
      hard: [
        {
          id: 'sports_hard_1',
          text: 'Who was the first gymnast to score a perfect 10 in the Olympics?',
          options: ['Simone Biles', 'Nadia Comaneci', 'Mary Lou Retton', 'Olga Korbut'],
          correctAnswer: 1
        },
        {
          id: 'sports_hard_2',
          text: 'In which city were the first modern Olympic Games held?',
          options: ['Paris', 'Athens', 'London', 'Rome'],
          correctAnswer: 1
        },
        {
          id: 'sports_hard_3',
          text: 'Who is the all-time leading scorer in NBA history?',
          options: ['Michael Jordan', 'Kobe Bryant', 'LeBron James', 'Kareem Abdul-Jabbar'],
          correctAnswer: 2
        },
        {
          id: 'sports_hard_4',
          text: 'Which country won the first FIFA World Cup in 1930?',
          options: ['Brazil', 'Italy', 'Uruguay', 'Argentina'],
          correctAnswer: 2
        },
        {
          id: 'sports_hard_5',
          text: 'In cricket, what is the term for a bowler taking three wickets with consecutive deliveries?',
          options: ['Hat-trick', 'Triple play', 'Turkey', 'Trifecta'],
          correctAnswer: 0
        }
      ]
    },
    wwe: {
      easy: [
        {
          id: 'wwe_easy_1',
          text: 'Who is known as "The Deadman" in WWE?',
          options: ['John Cena', 'The Undertaker', 'Triple H', 'Randy Orton'],
          correctAnswer: 1
        },
        {
          id: 'wwe_easy_2',
          text: 'What is the name of the biggest annual WWE event?',
          options: ['SummerSlam', 'Royal Rumble', 'WrestleMania', 'Survivor Series'],
          correctAnswer: 2
        },
        {
          id: 'wwe_easy_3',
          text: 'Who is known as "The People\'s Champion"?',
          options: ['Stone Cold Steve Austin', 'The Rock', 'John Cena', 'Hulk Hogan'],
          correctAnswer: 1
        },
        {
          id: 'wwe_easy_4',
          text: 'What was Dwayne "The Rock" Johnson\'s catchphrase?',
          options: ['You Can\'t See Me', 'If You Smell What The Rock Is Cooking', 'Rest In Peace', 'Woooo!'],
          correctAnswer: 1
        },
        {
          id: 'wwe_easy_5',
          text: 'Which WWE superstar says "You Can\'t See Me"?',
          options: ['Randy Orton', 'John Cena', 'Roman Reigns', 'Brock Lesnar'],
          correctAnswer: 1
        },
        {
          id: 'wwe_easy_6',
          text: 'What is the name of the WWE\'s weekly Monday night show?',
          options: ['SmackDown', 'NXT', 'Raw', 'Main Event'],
          correctAnswer: 2
        },
        {
          id: 'wwe_easy_7',
          text: 'Which WWE superstar is known as "The Viper"?',
          options: ['Randy Orton', 'Triple H', 'Edge', 'CM Punk'],
          correctAnswer: 0
        }
      ],
      medium: [
        {
          id: 'wwe_med_1',
          text: 'Who was the first WWE Undisputed Champion?',
          options: ['The Rock', 'Stone Cold Steve Austin', 'Chris Jericho', 'Triple H'],
          correctAnswer: 2
        },
        {
          id: 'wwe_med_2',
          text: 'Which WWE superstar has the nickname "The Game"?',
          options: ['Shawn Michaels', 'Triple H', 'Batista', 'Edge'],
          correctAnswer: 1
        },
        {
          id: 'wwe_med_3',
          text: 'Who is the longest-reigning WWE Champion of the modern era?',
          options: ['John Cena', 'CM Punk', 'Brock Lesnar', 'Roman Reigns'],
          correctAnswer: 3
        },
        {
          id: 'wwe_med_4',
          text: 'Which tag team was known as "The Hardy Boyz"?',
          options: ['Matt & Jeff Hardy', 'Edge & Christian', 'The Dudley Boyz', 'The New Day'],
          correctAnswer: 0
        },
        {
          id: 'wwe_med_5',
          text: 'Who was the first WWE Women\'s Champion in the modern era?',
          options: ['Trish Stratus', 'Lita', 'Charlotte Flair', 'Becky Lynch'],
          correctAnswer: 2
        },
        {
          id: 'wwe_med_6',
          text: 'Which WWE superstar has the finishing move called "RKO"?',
          options: ['Roman Reigns', 'Randy Orton', 'Rey Mysterio', 'Ricochet'],
          correctAnswer: 1
        }
      ],
      hard: [
        {
          id: 'wwe_hard_1',
          text: 'In what year did WWE change its name from WWF?',
          options: ['2000', '2002', '2004', '2006'],
          correctAnswer: 1
        },
        {
          id: 'wwe_hard_2',
          text: 'Who was the first WWE superstar to defeat The Undertaker at WrestleMania?',
          options: ['Brock Lesnar', 'Roman Reigns', 'Triple H', 'Shawn Michaels'],
          correctAnswer: 0
        },
        {
          id: 'wwe_hard_3',
          text: 'Which WWE pay-per-view features the "Elimination Chamber" match?',
          options: ['Extreme Rules', 'Hell in a Cell', 'Elimination Chamber', 'TLC'],
          correctAnswer: 2
        },
        {
          id: 'wwe_hard_4',
          text: 'Who was the inaugural WWE Universal Champion?',
          options: ['Kevin Owens', 'Finn Bálor', 'Seth Rollins', 'Roman Reigns'],
          correctAnswer: 1
        },
        {
          id: 'wwe_hard_5',
          text: 'Which WWE superstar has won the most Royal Rumble matches?',
          options: ['Stone Cold Steve Austin', 'John Cena', 'Triple H', 'Roman Reigns'],
          correctAnswer: 0
        },
        {
          id: 'wwe_hard_6',
          text: 'Who was the youngest WWE Champion in history?',
          options: ['Randy Orton', 'Brock Lesnar', 'The Rock', 'John Cena'],
          correctAnswer: 0
        }
      ]
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchQuizHistory()
      checkDailyQuizzes()
    }
  }, [user])

  useEffect(() => {
    // Check if user is new and show tutorial
    const hasSeenTutorial = localStorage.getItem('triviaQuizTutorialSeen')
    if (!hasSeenTutorial) {
      setShowTutorial(true)
    }
  }, [])

  useEffect(() => {
    // Timer for quiz questions
    if (quizStarted && !quizFinished) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Time's up, move to next question
            handleNextQuestion()
            return 15
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [quizStarted, quizFinished, currentQuestionIndex])

  const fetchQuizHistory = async () => {
    if (!user?.id || !isSupabaseConfigured) return

    try {
      const { data, error } = await supabase
        .from('quiz_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setQuizHistory(data || [])
    } catch (error) {
      console.warn('Failed to fetch quiz history:', error)
    }
  }

  const checkDailyQuizzes = async () => {
    if (!user?.id || !isSupabaseConfigured) return

    try {
      const { data, error } = await supabase.rpc('check_daily_quiz_limit', {
        user_id_param: user.id
      })

      if (error) throw error
      setQuizzesRemaining(data || 0)
    } catch (error) {
      console.warn('Failed to check quiz limit:', error)
      
      // Fallback to localStorage
      const today = new Date().toDateString()
      const quizzesUsed = parseInt(localStorage.getItem(`quizzesUsed_${user.id}_${today}`) || '0')
      setQuizzesRemaining(Math.max(0, 3 - quizzesUsed))
    }
  }

  const getRandomQuestions = (category: string, difficulty: string, count: number = 10): Question[] => {
    let availableQuestions: Question[] = []
    
    // If category is 'all', get questions from all categories
    if (category === 'all') {
      Object.keys(questionsDatabase).forEach(cat => {
        if (questionsDatabase[cat][difficulty]) {
          availableQuestions = [...availableQuestions, ...questionsDatabase[cat][difficulty]]
        }
      })
    } else {
      // Get questions from specific category
      availableQuestions = questionsDatabase[category]?.[difficulty] || []
    }
    
    // If not enough questions available, return what we have
    if (availableQuestions.length <= count) {
      return availableQuestions
    }
    
    // Shuffle and pick random questions
    const shuffled = [...availableQuestions].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
  }

  const startQuiz = () => {
    if (!selectedCategory || !selectedDifficulty) {
      toast.error('Please select a category and difficulty')
      return
    }

    if (quizzesRemaining <= 0) {
      toast.error('No quizzes remaining today!')
      return
    }

    // Get random questions
    const quizQuestions = getRandomQuestions(selectedCategory, selectedDifficulty)
    
    if (quizQuestions.length < 5) {
      toast.error('Not enough questions available for this category and difficulty. Please try different options.')
      return
    }

    setQuestions(quizQuestions)
    setCurrentQuestionIndex(0)
    setScore(0)
    setCorrectAnswers(0)
    setSelectedOption(null)
    setIsAnswerCorrect(null)
    setTimeLeft(15)
    setQuizStartTime(Date.now())
    setQuizStarted(true)
    setQuizFinished(false)
  }

  const handleAnswerSelection = (optionIndex: number) => {
    if (selectedOption !== null) return // Already answered
    
    setSelectedOption(optionIndex)
    
    const currentQuestion = questions[currentQuestionIndex]
    const isCorrect = optionIndex === currentQuestion.correctAnswer
    setIsAnswerCorrect(isCorrect)
    
    if (isCorrect) {
      const pointsPerQuestion = difficulties.find(d => d.id === selectedDifficulty)?.pointsPerQuestion || 10
      setScore(prev => prev + pointsPerQuestion)
      setCorrectAnswers(prev => prev + 1)
    }
    
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    
    // Auto-advance after 2 seconds
    setTimeout(() => {
      handleNextQuestion()
    }, 2000)
  }

  const handleNextQuestion = () => {
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setSelectedOption(null)
      setIsAnswerCorrect(null)
      setTimeLeft(15)
    } else {
      // End of quiz
      finishQuiz()
    }
  }

  const finishQuiz = async () => {
    setQuizFinished(true)
    setQuizEndTime(Date.now())
    
    const timeTaken = Math.floor((Date.now() - quizStartTime) / 1000)
    
    // Save quiz result
    if (user?.id && isSupabaseConfigured) {
      try {
        setLoading(true)
        
        const categoryName = categories.find(c => c.id === selectedCategory)?.name || ''
        const difficultyName = selectedDifficulty || ''
        
        const { error } = await supabase.rpc('process_quiz_completion', {
          user_id_param: user.id,
          score_param: score,
          total_questions_param: questions.length,
          correct_answers_param: correctAnswers,
          time_taken_param: timeTaken,
          category_param: categoryName,
          difficulty_param: difficultyName
        })

        if (error) throw error
        
        // Update local state
        const today = new Date().toDateString()
        const quizzesUsed = parseInt(localStorage.getItem(`quizzesUsed_${user.id}_${today}`) || '0') + 1
        localStorage.setItem(`quizzesUsed_${user.id}_${today}`, quizzesUsed.toString())
        
        setQuizzesRemaining(prev => Math.max(0, prev - 1))
        
        // Show confetti for good scores
        if (correctAnswers >= questions.length * 0.7) {
          setShowConfetti(true)
          setTimeout(() => setShowConfetti(false), 5000)
        }
        
        // Refresh profile and history
        await refreshProfile()
        await fetchQuizHistory()
        
        toast.success(`Quiz completed! You earned ${score} points!`)
      } catch (error) {
        console.error('Error saving quiz result:', error)
        toast.error('Failed to save quiz result')
      } finally {
        setLoading(false)
      }
    } else {
      // Offline mode or Supabase not configured
      toast.success(`Quiz completed! You scored ${correctAnswers} out of ${questions.length}!`)
    }
  }

  const resetQuiz = () => {
    setQuizStarted(false)
    setQuizFinished(false)
    setCurrentQuestionIndex(0)
    setSelectedOption(null)
    setIsAnswerCorrect(null)
    setScore(0)
    setCorrectAnswers(0)
    setTimeLeft(15)
    setQuestions([])
  }

  const getCategoryColor = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.color || 'from-blue-400 to-blue-600'
  }

  const getDifficultyColor = (difficultyId: string) => {
    return difficulties.find(d => d.id === difficultyId)?.color || 'from-blue-400 to-blue-600'
  }

  const getTimeUntilReset = () => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    
    const diff = tomorrow.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Confetti Effect */}
      {showConfetti && (
        <ReactConfetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={500}
        />
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          <span className="bg-gradient-to-r from-blue-400 via-cyan-500 to-teal-500 bg-clip-text text-transparent">
            Trivia Quiz
          </span>
        </h1>
        <p className="text-xl text-gray-300 mb-6">
          Test your knowledge and earn points with fun trivia questions!
        </p>
        
        {/* Quizzes Remaining */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-400" />
              <span className="text-white font-medium">
                {quizzesRemaining} quizzes remaining
              </span>
            </div>
            {quizzesRemaining === 0 && (
              <p className="text-gray-400 text-sm mt-1">
                Resets in {getTimeUntilReset()}
              </p>
            )}
          </div>
          
          <button
            onClick={() => setShowTutorial(true)}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 transition-colors"
          >
            <Info className="h-5 w-5 text-white" />
          </button>
        </div>
      </motion.div>

      {/* Quiz Setup or Quiz Content */}
      {!quizStarted ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
        >
          {/* Category Selection */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Select Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map(category => {
                const CategoryIcon = category.icon
                return (
                  <motion.button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-4 rounded-xl transition-all duration-300 ${
                      selectedCategory === category.id
                        ? `bg-gradient-to-br ${category.color} text-white`
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <CategoryIcon className="h-6 w-6" />
                      <span className="text-sm font-medium">{category.name}</span>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Difficulty Selection */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Select Difficulty</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {difficulties.map(difficulty => (
                <motion.button
                  key={difficulty.id}
                  onClick={() => setSelectedDifficulty(difficulty.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-4 rounded-xl transition-all duration-300 ${
                    selectedDifficulty === difficulty.id
                      ? `bg-gradient-to-br ${difficulty.color} text-white`
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-2xl">{difficulty.icon}</div>
                    <span className="font-medium">{difficulty.name}</span>
                    <span className="text-sm">{difficulty.pointsPerQuestion} points/question</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Quiz Information */}
          <div className="bg-white/10 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-400" />
              Quiz Information
            </h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                <span>10 questions per quiz</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                <span>15 seconds per question</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                <span>30 points per correct answer</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                <span>3 quizzes per day</span>
              </li>
            </ul>
          </div>

          {/* Start Button */}
          <motion.button
            onClick={startQuiz}
            disabled={!selectedCategory || !selectedDifficulty || quizzesRemaining <= 0}
            whileHover={{ scale: selectedCategory && selectedDifficulty && quizzesRemaining > 0 ? 1.05 : 1 }}
            whileTap={{ scale: selectedCategory && selectedDifficulty && quizzesRemaining > 0 ? 0.95 : 1 }}
            className={`w-full py-4 rounded-xl font-bold text-xl transition-all duration-300 flex items-center justify-center gap-2 ${
              selectedCategory && selectedDifficulty && quizzesRemaining > 0
                ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-xl hover:shadow-blue-500/25'
                : 'bg-gray-500 text-gray-300 cursor-not-allowed'
            }`}
          >
            <Play className="h-6 w-6" />
            Start Quiz
          </motion.button>
        </motion.div>
      ) : quizFinished ? (
        // Quiz Results
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
        >
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Quiz Results</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-6xl mb-4">
                  {correctAnswers >= questions.length * 0.7 ? '🏆' : 
                   correctAnswers >= questions.length * 0.4 ? '👍' : '😢'}
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {correctAnswers} / {questions.length} Correct
                </h3>
                <p className="text-gray-300">
                  {correctAnswers === questions.length ? 'Perfect Score!' : 
                   correctAnswers >= questions.length * 0.7 ? 'Great job!' :
                   correctAnswers >= questions.length * 0.4 ? 'Good effort!' : 'Better luck next time!'}
                </p>
              </div>
              
              <div className="bg-white/10 rounded-xl p-6">
                <h4 className="text-lg font-bold text-white mb-4">Quiz Details</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Category:</span>
                    <span className="text-white font-medium">
                      {categories.find(c => c.id === selectedCategory)?.name || 'All Categories'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Difficulty:</span>
                    <span className="text-white font-medium">
                      {difficulties.find(d => d.id === selectedDifficulty)?.name || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Time Taken:</span>
                    <span className="text-white font-medium">
                      {Math.floor((quizEndTime - quizStartTime) / 1000)} seconds
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Points Earned:</span>
                    <span className="text-blue-400 font-bold">{score} points</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-400/20 to-cyan-500/20 rounded-xl p-6 border border-blue-400/30">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-blue-400" />
                  Your Performance
                </h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-300">Accuracy</span>
                      <span className="text-white font-medium">
                        {Math.round((correctAnswers / questions.length) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-cyan-600 h-2.5 rounded-full" 
                        style={{ width: `${(correctAnswers / questions.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-300">Speed</span>
                      <span className="text-white font-medium">
                        {Math.round((quizEndTime - quizStartTime) / 1000 / questions.length)} sec/question
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-2.5 rounded-full" 
                        style={{ width: `${100 - Math.min(100, ((quizEndTime - quizStartTime) / 1000 / questions.length / 15) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4">
                <motion.button
                  onClick={resetQuiz}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-medium transition-colors"
                >
                  New Quiz
                </motion.button>
                
                <motion.button
                  onClick={() => {
                    // Share quiz result
                    if (navigator.share) {
                      navigator.share({
                        title: 'My Trivia Quiz Result',
                        text: `I scored ${correctAnswers}/${questions.length} and earned ${score} points in the Trivia Quiz!`,
                        url: window.location.href
                      })
                    } else {
                      // Fallback to clipboard
                      navigator.clipboard.writeText(
                        `I scored ${correctAnswers}/${questions.length} and earned ${score} points in the Trivia Quiz!`
                      )
                      toast.success('Result copied to clipboard!')
                    }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Trophy className="h-5 w-5" />
                  Share Result
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        // Quiz In Progress
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
        >
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-gray-300">Question {currentQuestionIndex + 1} of {questions.length}</span>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-400" />
                <span className={`font-medium ${timeLeft <= 5 ? 'text-red-400' : 'text-yellow-400'}`}>
                  {timeLeft}s
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-gradient-to-r from-blue-500 to-cyan-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-white mb-6">
              {questions[currentQuestionIndex]?.text}
            </h3>
            
            <div className="space-y-4">
              {questions[currentQuestionIndex]?.options.map((option, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleAnswerSelection(index)}
                  disabled={selectedOption !== null}
                  whileHover={{ scale: selectedOption === null ? 1.02 : 1 }}
                  whileTap={{ scale: selectedOption === null ? 0.98 : 1 }}
                  className={`w-full p-4 rounded-xl text-left transition-all duration-300 ${
                    selectedOption === null
                      ? 'bg-white/10 hover:bg-white/20 text-white'
                      : selectedOption === index
                        ? isAnswerCorrect
                          ? 'bg-green-500/30 border border-green-500/50 text-white'
                          : 'bg-red-500/30 border border-red-500/50 text-white'
                        : index === questions[currentQuestionIndex].correctAnswer && selectedOption !== null
                          ? 'bg-green-500/30 border border-green-500/50 text-white'
                          : 'bg-white/10 text-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      selectedOption === null
                        ? 'bg-white/20 text-white'
                        : selectedOption === index
                          ? isAnswerCorrect
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                          : index === questions[currentQuestionIndex].correctAnswer && selectedOption !== null
                            ? 'bg-green-500 text-white'
                            : 'bg-white/20 text-gray-400'
                    }`}>
                      {selectedOption === index
                        ? isAnswerCorrect
                          ? <CheckCircle className="h-5 w-5" />
                          : <XCircle className="h-5 w-5" />
                        : index === questions[currentQuestionIndex].correctAnswer && selectedOption !== null
                          ? <CheckCircle className="h-5 w-5" />
                          : String.fromCharCode(65 + index)}
                    </div>
                    <span className="flex-1">{option}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Score */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-yellow-400" />
              <span className="text-yellow-400 font-bold">{score} points</span>
            </div>
            
            <button
              onClick={handleNextQuestion}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            >
              Skip
            </button>
          </div>
        </motion.div>
      )}

      {/* Quiz History */}
      {!quizStarted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <History className="h-5 w-5 text-blue-400" />
            Recent Quiz History
          </h3>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {quizHistory.length > 0 ? (
              quizHistory.map((quiz) => (
                <div
                  key={quiz.id}
                  className="flex items-center justify-between p-4 bg-white/10 rounded-xl border border-white/20"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-white font-medium">
                        {quiz.category || 'All Categories'}
                      </h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        quiz.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                        quiz.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {quiz.difficulty || 'Unknown'}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      {new Date(quiz.created_at).toLocaleDateString()} • {quiz.correct_answers}/{quiz.total_questions} correct
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-blue-400 font-bold">{quiz.score} points</p>
                    <p className="text-gray-400 text-xs">{quiz.time_taken}s</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No quiz history yet</p>
                <p className="text-gray-500 text-sm">
                  Complete your first quiz to see your history
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Tutorial Modal */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowTutorial(false)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 max-w-lg w-full"
            >
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Info className="h-6 w-6 text-blue-400" />
                How to Play Trivia Quiz
              </h2>
              
              <div className="space-y-4 text-gray-300">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                  <p>Select a category and difficulty level</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                  <p>Answer 10 questions within the time limit</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                  <p>Each correct answer earns you points based on difficulty</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">4</div>
                  <p>You have 15 seconds to answer each question</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">5</div>
                  <p>You can play 3 quizzes per day</p>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-400/20 rounded-xl border border-blue-400/30">
                <p className="text-blue-300 text-sm font-medium">
                  💡 Tip: Choose categories you're familiar with for the best chance to earn points!
                </p>
              </div>
              
              <button
                onClick={() => {
                  setShowTutorial(false)
                  localStorage.setItem('triviaQuizTutorialSeen', 'true')
                }}
                className="w-full mt-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl font-medium transition-colors"
              >
                Got it!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message for Not Enough Questions */}
      <AnimatePresence>
        {selectedCategory && selectedDifficulty && getRandomQuestions(selectedCategory, selectedDifficulty).length < 5 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 bg-red-500/90 backdrop-blur-sm rounded-xl p-4 border border-red-400 shadow-xl z-50 max-w-md"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-white font-semibold mb-1">Not enough questions available for this category and difficulty. Please try different options.</h4>
                <button
                  onClick={() => {
                    setSelectedCategory(null)
                    setSelectedDifficulty(null)
                  }}
                  className="text-white/80 hover:text-white text-sm underline"
                >
                  Reset selections
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default TriviaQuizPage