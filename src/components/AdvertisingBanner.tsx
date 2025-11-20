// import React, { useState, useEffect } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { X, ExternalLink, Clock, Eye } from 'lucide-react';

// interface Advertisement {
//   id: string;
//   title: string;
//   description: string;
//   imageUrl: string;
//   linkUrl: string;
//   sponsor: string;
//   startDate: Date;
//   endDate: Date;
//   impressions: number;
//   clicks: number;
//   isActive: boolean;
//   position: 'banner' | 'sidebar' | 'modal' | 'inline';
//   priority: number;
// }

// interface AdvertisingBannerProps {
//   position: 'banner' | 'sidebar' | 'modal' | 'inline';
//   className?: string;
// }

// const AdvertisingBanner: React.FC<AdvertisingBannerProps> = ({ position, className = '' }) => {
//   const [currentAd, setCurrentAd] = useState<Advertisement | null>(null);
//   const [isVisible, setIsVisible] = useState(true);
//   const [timeRemaining, setTimeRemaining] = useState<string>('');

//   // Mock advertisements data
//   const mockAds: Advertisement[] = [
//     {
//       id: 'ad-1',
//       title: 'Professional Development Workshop',
//       description: 'Enhance your leadership skills with our upcoming workshop series',
//       imageUrl: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400',
//       linkUrl: 'https://example.com/workshop',
//       sponsor: 'HR Development',
//       startDate: new Date('2025-01-01'),
//       endDate: new Date('2025-02-28'),
//       impressions: 1250,
//       clicks: 89,
//       isActive: true,
//       position: position,
//       priority: 1
//     },
//     {
//       id: 'ad-2',
//       title: 'Employee Benefits Update',
//       description: 'New health and wellness benefits available starting next quarter',
//       imageUrl: 'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=400',
//       linkUrl: 'https://example.com/benefits',
//       sponsor: 'Benefits Team',
//       startDate: new Date('2025-01-15'),
//       endDate: new Date('2025-03-15'),
//       impressions: 890,
//       clicks: 67,
//       isActive: true,
//       position: position,
//       priority: 2
//     },
//     {
//       id: 'ad-3',
//       title: 'Company Social Event',
//       description: 'Join us for the annual company picnic and team building activities',
//       imageUrl: 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=400',
//       linkUrl: 'https://example.com/social',
//       sponsor: 'Events Committee',
//       startDate: new Date('2025-01-10'),
//       endDate: new Date('2025-04-30'),
//       impressions: 2100,
//       clicks: 156,
//       isActive: true,
//       position: position,
//       priority: 3
//     }
//   ];

//   const [currentIndex, setCurrentIndex] = useState(0);
//   const ads = mockAds.filter(ad => ad.isActive && ad.position === position);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setCurrentIndex(prev => (prev + 1) % ads.length);
//     }, 5000);
//     return () => clearInterval(interval);
//   }, [ads.length]);

//   useEffect(() => {
//     const relevantAds = mockAds
//       .filter(ad => ad.position === position && ad.isActive)
//       .sort((a, b) => a.priority - b.priority);
    
//     if (relevantAds.length > 0) {
//       setCurrentAd(relevantAds[0]);
//     }
//   }, [position]);

//   useEffect(() => {
//     if (currentAd) {
//       const updateTimeRemaining = () => {
//         const now = new Date();
//         const timeDiff = currentAd.endDate.getTime() - now.getTime();
        
//         if (timeDiff > 0) {
//           const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
//           const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
//           setTimeRemaining(`${days}d ${hours}h remaining`);
//         } else {
//           setTimeRemaining('Expired');
//         }
//       };

//       updateTimeRemaining();
//       const interval = setInterval(updateTimeRemaining, 60000);

//       return () => clearInterval(interval);
//     }
//   }, [currentAd]);

//   const handleAdClick = () => {
//     trackAdInteraction('click');
//     window.open('https://www.bbc.com', '_blank', 'noopener,noreferrer');
//   };

//   const handleAdView = () => {
//     if (currentAd) {
//       trackAdInteraction('view');
//     }
//   };

//   const trackAdInteraction = async (type: 'view' | 'click') => {
//     if (!currentAd) return;

//     try {
//       await fetch('/api/advertising/track', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${localStorage.getItem('token')}`
//         },
//         body: JSON.stringify({
//           adId: currentAd.id,
//           type,
//           timestamp: new Date().toISOString(),
//           userId: localStorage.getItem('userId'),
//           position: position
//         })
//       });
//     } catch (error) {
//       console.error('Error tracking ad interaction:', error);
//     }
//   };

//   const handleClose = () => {
//     setIsVisible(false);
//   };

//   useEffect(() => {
//     if (currentAd && isVisible) {
//       handleAdView();
//     }
//   }, [currentAd, isVisible]);

//   if (!currentAd || !isVisible) {
//     return null;
//   }

//   const getAdLayout = () => {
//     switch (position) {
//       case 'banner':
//         return (
//           <motion.div
//             initial={{ opacity: 0, y: -20 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: -20 }}
//             className={`relative bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg overflow-hidden mb-6 ${className}`}
//           >
//             <div className="flex items-center justify-between p-4">
//               <div className="flex items-center space-x-4">
//                 <img
//                   src={currentAd.imageUrl}
//                   alt={currentAd.title}
//                   className="w-16 h-16 rounded-lg object-cover"
//                 />
//                 <div className="flex-1">
//                   <h3 className="font-semibold text-gray-800 text-lg">{currentAd.title}</h3>
//                   <p className="text-gray-600 text-sm">{currentAd.description}</p>
//                   <div className="flex items-center space-x-4 mt-2">
//                     <span className="text-xs text-gray-500">By {currentAd.sponsor}</span>
//                     <div className="flex items-center space-x-1 text-xs text-gray-500">
//                       <Clock className="h-3 w-3" />
//                       <span>{timeRemaining}</span>
//                     </div>
//                     <div className="flex items-center space-x-1 text-xs text-gray-500">
//                       <Eye className="h-3 w-3" />
//                       <span>{currentAd.impressions.toLocaleString()} views</span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//               <div className="flex items-center space-x-2">
//                 <motion.button
//                   whileHover={{ scale: 1.05 }}
//                   whileTap={{ scale: 0.95 }}
//                   onClick={handleAdClick}
//                   className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
//                 >
//                   <span>Learn More</span>
//                   <ExternalLink className="h-4 w-4" />
//                 </motion.button>
//                 <button
//                   onClick={handleClose}
//                   className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
//                   title="Close"
//                 >
//                   <X className="h-4 w-4" />
//                 </button>
//               </div>
//             </div>
//           </motion.div>
//         );

//       case 'sidebar':
//         return (
//           <motion.div
//             initial={{ opacity: 0, x: 20 }}
//             animate={{ opacity: 1, x: 0 }}
//             exit={{ opacity: 0, x: 20 }}
//             className={`relative bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-6 ${className}`}
//           >
//             <button
//               onClick={handleClose}
//               className="absolute top-2 right-2 z-10 p-1 bg-white/80 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
//               title="Close"
//             >
//               <X className="h-4 w-4" />
//             </button>
            
//             <div className="relative">
//               <img
//                 src={currentAd.imageUrl}
//                 alt={currentAd.title}
//                 className="w-full h-32 object-cover"
//               />
//               <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
//                 <span className="text-xs text-white/80">Sponsored by {currentAd.sponsor}</span>
//               </div>
//             </div>
            
//             <div className="p-4">
//               <h4 className="font-semibold text-gray-800 mb-2">{currentAd.title}</h4>
//               <p className="text-gray-600 text-sm mb-3">{currentAd.description}</p>
              
//               <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
//                 <div className="flex items-center space-x-1">
//                   <Clock className="h-3 w-3" />
//                   <span>{timeRemaining}</span>
//                 </div>
//                 <div className="flex items-center space-x-1">
//                   <Eye className="h-3 w-3" />
//                   <span>{currentAd.impressions.toLocaleString()}</span>
//                 </div>
//               </div>
              
//               <motion.button
//                 whileHover={{ scale: 1.02 }}
//                 whileTap={{ scale: 0.98 }}
//                 onClick={handleAdClick}
//                 className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
//               >
//                 <span>Learn More</span>
//                 <ExternalLink className="h-4 w-4" />
//               </motion.button>
//             </div>
//           </motion.div>
//         );

//       case 'inline':
//         return (
//           <motion.div
//             initial={{ opacity: 0, scale: 0.95 }}
//             animate={{ opacity: 1, scale: 1 }}
//             exit={{ opacity: 0, scale: 0.95 }}
//             className={`relative bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-4 my-6 ${className}`}
//           >
//             <button
//               onClick={handleClose}
//               className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
//               title="Close"
//             >
//               <X className="h-4 w-4" />
//             </button>
            
//             <div className="flex items-start space-x-4">
//               <img
//                 src={currentAd.imageUrl}
//                 alt={currentAd.title}
//                 className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
//               />
//               <div className="flex-1 min-w-0">
//                 <div className="flex items-center space-x-2 mb-1">
//                   <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Sponsored</span>
//                   <span className="text-xs text-gray-500">{currentAd.sponsor}</span>
//                 </div>
//                 <h4 className="font-semibold text-gray-800 mb-1">{currentAd.title}</h4>
//                 <p className="text-gray-600 text-sm mb-2">{currentAd.description}</p>
//                 <motion.button
//                   whileHover={{ scale: 1.02 }}
//                   whileTap={{ scale: 0.98 }}
//                   onClick={handleAdClick}
//                   className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
//                 >
//                   <span>Learn More</span>
//                   <ExternalLink className="h-3 w-3" />
//                 </motion.button>
//               </div>
//             </div>
//           </motion.div>
//         );

//       default:
//         return null;
//     }
//   };

//   return (
//     <AnimatePresence>
//       {getAdLayout()}
//     </AnimatePresence>
//   );
// };

// export default AdvertisingBanner;
