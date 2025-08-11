import { User, Employee, Event } from '../utils/types';

export const users: User[] = [
  {
    id: '1',
    email: 'admin@company.com',
    name: 'Jared Moodley',
    role: 'admin',
    avatar: 'https://mazarsglobalcloud.sharepoint.com/:i:/r/sites/ZAF-Marketing/Presenting%20Mazars/Corporate%20photos/Cape%20Town/Jared%20Moodley%20Square.jpg?csf=1&web=1&e=vwcHAJ'
  },
  {
    id: '2',
    email: 'voter@company.com',
    name: 'Mike Chen',
    role: 'voter',
    avatar: 'https://images.pexels.com/photos/697509/pexels-photo-697509.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
  }
];

export const employees: Employee[] = [
  {
    id: '1',
    name: 'Jason Nesset',
    position: 'Manager',
    department: 'IT Audit',
    avatar: 'https://mazarsglobalcloud.sharepoint.com/:i:/r/sites/ZAF-Marketing/Presenting%20Mazars/Corporate%20photos/Cape%20Town/Jasson%20Nesset_Square.jpg?csf=1&web=1&e=WhbjHs',
    bio: 'Jason is a passionate Manager with expertise in ITGC and cloud architecture.',
    achievements: [
      'Did ITGC for Forecia',
      'Reduced application load time by 40%',
      'Mentored Employees',
      'Published 3 technical articles'
    ],
    yearsOfService: 6,
    skills: ['ITGC', 'Audit', 'Managing'],
    votes: 127
  },
  {
    id: '2',
    name: 'Thabo Thompson',
    position: 'Accountant',
    department: 'Accounting',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=2',
    bio: 'David brings strategic vision and customer-centric thinking to every project. His ability to translate complex requirements into actionable roadmaps has driven significant product growth.',
    achievements: [
      'Launched 5 successful product features',
      'Increased user engagement by 60%',
      'Established agile processes across teams',
      'Won Product Excellence Award 2023'
    ],
    yearsOfService: 3,
    skills: ['Product Strategy', 'Agile', 'User Research', 'Analytics', 'Leadership'],
    votes: 98
  },
  {
    id: '3',
    name: 'Emma Wilson',
    position: 'UX Designer',
    department: 'Marketing',
    avatar: 'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=2',
    bio: 'Emma creates beautiful, user-centered designs that solve real problems. Her design thinking approach and attention to accessibility have elevated our entire user experience.',
    achievements: [
      'Redesigned main application interface',
      'Improved accessibility score to 98%',
      'Led design system implementation',
      'Reduced user support tickets by 35%'
    ],
    yearsOfService: 2,
    skills: ['UI/UX Design', 'Figma', 'Accessibility', 'User Research', 'Prototyping'],
    votes: 156
  },
  {
    id: '4',
    name: 'James Awonke',
    position: 'DevOps Engineer',
    department: 'IT',
    avatar: 'https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=2',
    bio: 'James ensures our systems run smoothly 24/7. His expertise in cloud infrastructure and automation has significantly improved our deployment reliability and system performance.',
    achievements: [
      'Achieved 99.9% system uptime',
      'Automated 90% of deployment processes',
      'Reduced infrastructure costs by 25%',
      'Implemented comprehensive monitoring'
    ],
    yearsOfService: 5,
    skills: ['AWS', 'Kubernetes', 'Terraform', 'CI/CD', 'Monitoring'],
    votes: 89
  },
  {
    id: '5',
    name: 'Sofia Jonkers',
    position: 'Data Scientist',
    department: 'Analytics',
    avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=2',
    bio: 'Sofia transforms data into actionable insights that drive business decisions. Her machine learning models and analytical frameworks have uncovered opportunities worth millions.',
    achievements: [
      'Built predictive models saving $2M annually',
      'Established company-wide analytics framework',
      'Led data governance initiative',
      'Published research in top-tier journals'
    ],
    yearsOfService: 3,
    skills: ['Python', 'Machine Learning', 'SQL', 'Tableau', 'Statistics'],
    votes: 134
  },
  {
    id: '6',
    name: 'Marcus Johnson',
    position: 'Sales Director',
    department: 'Sales',
    avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=2',
    bio: 'Marcus has consistently exceeded sales targets while building lasting relationships with key clients. His strategic approach to business development has opened new market opportunities.',
    achievements: [
      'Exceeded sales quota by 150% for 3 consecutive years',
      'Secured 10 enterprise clients worth $5M',
      'Built and trained high-performing sales team',
      'Developed new market penetration strategy'
    ],
    yearsOfService: 6,
    skills: ['Sales Strategy', 'Relationship Building', 'Negotiation', 'CRM', 'Leadership'],
    votes: 112
  }
];

export const events: Event[] = [
  {
    id: '1',
    title: 'Annual Innovation Summit 2024',
    description: 'A three-day event showcasing cutting-edge technologies and innovative solutions from across the industry.',
    date: '2024-03-15',
    location: 'Tech Conference Center, San Francisco',
    image: 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=2',
    organizer: 'Innovation Team',
    category: 'Technology',
    votes: 234,
    details: 'Join us for an inspiring journey through the latest technological breakthroughs. Features keynote speakers from leading tech companies, hands-on workshops, networking sessions, and product demonstrations. This summit will cover AI/ML advancements, cloud computing innovations, and emerging technologies shaping the future.'
  },
  {
    id: '2',
    title: 'Company Wellness Retreat',
    description: 'A rejuvenating weekend focused on mental health, physical wellness, and team building activities.',
    date: '2024-04-20',
    location: 'Mountain View Resort, Colorado',
    image: 'https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=2',
    organizer: 'HR Department',
    category: 'Wellness',
    votes: 189,
    details: 'Escape the daily grind and focus on your wellbeing. This retreat includes yoga sessions, meditation workshops, hiking expeditions, healthy cooking classes, and team building exercises. Professional wellness coaches will guide sessions on stress management, work-life balance, and building resilient teams.'
  },
  {
    id: '3',
    title: 'Global Sales Conference',
    description: 'Bringing together sales teams worldwide to share strategies, celebrate achievements, and set goals.',
    date: '2024-05-10',
    location: 'Convention Center, New York',
    image: 'https://images.pexels.com/photos/1181354/pexels-photo-1181354.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=2',
    organizer: 'Sales Department',
    category: 'Business',
    votes: 167,
    details: 'Our biggest sales event of the year featuring success stories from top performers, training sessions on new sales methodologies, product launches, and recognition ceremonies. Network with colleagues from around the globe and learn from industry experts about market trends and customer engagement strategies.'
  },
  {
    id: '4',
    title: 'Diversity & Inclusion Workshop',
    description: 'Interactive sessions promoting inclusive workplace culture and celebrating our diverse community.',
    date: '2024-06-05',
    location: 'Company Headquarters, Austin',
    image: 'https://images.pexels.com/photos/1181435/pexels-photo-1181435.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=2',
    organizer: 'Diversity Council',
    category: 'Culture',
    votes: 198,
    details: 'Participate in meaningful conversations about building an inclusive workplace. The workshop includes panel discussions with diverse leaders, unconscious bias training, cultural competency sessions, and collaborative activities to strengthen our inclusive culture. Guest speakers will share insights on diversity best practices.'
  },
  {
    id: '5',
    title: 'Customer Success Summit',
    description: 'Focused on enhancing customer relationships and delivering exceptional service experiences.',
    date: '2024-07-12',
    location: 'Oceanfront Hotel, Miami',
    image: 'https://images.pexels.com/photos/1181298/pexels-photo-1181298.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=2',
    organizer: 'Customer Success Team',
    category: 'Customer Experience',
    votes: 145,
    details: 'Learn from customer success experts about building lasting relationships, reducing churn, and maximizing customer lifetime value. The summit features case studies, interactive workshops, customer feedback sessions, and strategic planning for enhanced service delivery.'
  },
  {
    id: '6',
    title: 'Sustainability & Green Initiative Fair',
    description: 'Showcasing environmental initiatives and sustainable practices for a greener future.',
    date: '2024-08-18',
    location: 'Eco-Park Convention Center, Portland',
    image: 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=2',
    organizer: 'Sustainability Committee',
    category: 'Environment',
    votes: 176,
    details: 'Explore innovative sustainability solutions and learn how to implement green practices in your daily work. Features eco-friendly vendor exhibitions, carbon footprint workshops, renewable energy presentations, and collaborative sessions on building a sustainable workplace culture.'
  }
];