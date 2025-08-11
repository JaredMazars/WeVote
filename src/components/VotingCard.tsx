import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Award, Calendar, MapPin, User, Building2 } from 'lucide-react';

interface VotingCardProps {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  // votes: number;
  type: 'employee' | 'event';
  onClick: () => void;
  additionalInfo?: string;
}

const VotingCard: React.FC<VotingCardProps> = ({
  title,
  subtitle,
  description,
  image,
  // votes,
  type,
  onClick,
  additionalInfo
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        y: -8, 
        boxShadow: '0 20px 40px rgba(0, 114, 206, 0.15)' 
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 border border-gray-100 hover:border-[#0072CE]/30"
    >
      <div className="relative h-48 overflow-hidden">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 text-white">
          {/* <div className="flex items-center space-x-2 text-sm">
            <Award className="h-4 w-4" />
            <span className="font-medium">{votes} votes</span>
          </div> */}
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-[#464B4B] mb-1 line-clamp-1">
              {title}
            </h3>
            <div className="flex items-center text-[#0072CE] text-sm font-medium mb-2">
              {type === 'employee' ? (
                <>
                  <Building2 className="h-4 w-4 mr-1" />
                  {subtitle}
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-1" />
                  {subtitle}
                </>
              )}
            </div>
          </div>
          <motion.div
            whileHover={{ x: 4 }}
            className="ml-2 text-[#0072CE]"
          >
            <ChevronRight className="h-5 w-5" />
          </motion.div>
        </div>

        <p className="text-[#464B4B]/80 text-sm leading-relaxed mb-4 line-clamp-3">
          {description}
        </p>

        {additionalInfo && (
          <div className="flex items-center text-xs text-[#464B4B]/60 mb-4">
            <MapPin className="h-3 w-3 mr-1" />
            {additionalInfo}
          </div>
        )}

        <div className="flex items-center justify-between">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all duration-200"
          >
            View Details
          </motion.button>
          {/* <div className="text-right">
            <div className="text-xs text-[#464B4B]/60">Popularity</div>
            <div className="flex items-center">
              <div className="h-2 w-16 bg-gray-200 rounded-full overflow-hidden mr-2">
                <div 
                  className="h-full bg-gradient-to-r from-[#0072CE] to-[#171C8F] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((votes / 250) * 100, 100)}%` }}
                />
              </div>
              <span className="text-xs font-medium text-[#464B4B]">{votes}</span>
            </div>
          </div> */}
        </div>
      </div>
    </motion.div>
  );
};

export default VotingCard;