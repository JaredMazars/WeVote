import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  UserCheck, 
  FileText, 
  Monitor, 
  AlertCircle, 
  CheckCircle,
  Send,
  User,
  Mail,
  MessageSquare
} from 'lucide-react';

interface ProxyAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (proxyData: any) => void;
  initialData?: any;
}

const ProxyAssignmentModal: React.FC<ProxyAssignmentModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  initialData
}) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [proxyData, setProxyData] = useState({
    proxyHolderName: initialData?.proxyHolderName || '',
    proxyHolderEmail: initialData?.proxyHolderEmail || '',
    proxyHolderPhone: '',
    appointmentType: 'discretional',
    votingInstructions: initialData?.votingInstructions || '',
    trusteeRemuneration: '',
    remunerationPolicy: '',
    auditorsAppointment: '',
    agmMotions: '',
    specialInstructions: ''
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Simulate API call to save proxy assignment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real implementation, save to database
      console.log('Saving proxy assignment:', proxyData);
      
      onComplete(proxyData);
      onClose();
    } catch (error) {
      console.error('Error saving proxy assignment:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0072CE] to-[#171C8F] px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Complete Digital Proxy Assignment</h2>
                  <p className="text-white/80 text-sm">Set up your voting proxy for the AGM</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            {/* Progress Steps */}
            <div className="mt-4 flex items-center space-x-4">
              {[1, 2, 3].map((stepNum) => (
                <div key={stepNum} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNum ? 'bg-white text-[#0072CE]' : 'bg-white/20 text-white'
                  }`}>
                    {step > stepNum ? <CheckCircle className="h-4 w-4" /> : stepNum}
                  </div>
                  {stepNum < 3 && (
                    <div className={`w-12 h-1 mx-2 ${
                      step > stepNum ? 'bg-white' : 'bg-white/20'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-96 overflow-y-auto">
            {/* Step 1: Proxy Holder Details */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <User className="h-12 w-12 text-[#0072CE] mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Proxy Holder Information</h3>
                  <p className="text-gray-600">Who will vote on your behalf?</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Proxy Holder Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={proxyData.proxyHolderName}
                      onChange={(e) => setProxyData({...proxyData, proxyHolderName: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
                      placeholder="Enter proxy holder's full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Proxy Holder Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={proxyData.proxyHolderEmail}
                      onChange={(e) => setProxyData({...proxyData, proxyHolderEmail: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
                      placeholder="Enter proxy holder's email"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Proxy Holder Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={proxyData.proxyHolderPhone}
                      onChange={(e) => setProxyData({...proxyData, proxyHolderPhone: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
                      placeholder="Enter proxy holder's phone number"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Appointment Type */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <FileText className="h-12 w-12 text-[#0072CE] mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Proxy Appointment Type</h3>
                  <p className="text-gray-600">How should your proxy vote?</p>
                </div>

                <div className="space-y-4">
                  <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-[#0072CE] transition-colors">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="appointmentType"
                        value="discretional"
                        checked={proxyData.appointmentType === 'discretional'}
                        onChange={(e) => setProxyData({...proxyData, appointmentType: e.target.value})}
                        className="w-4 h-4 text-[#0072CE] border-gray-300 focus:ring-[#0072CE] mt-1"
                      />
                      <div>
                        <div className="font-medium text-gray-900">Discretional Proxy</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Your proxy holder can vote at their discretion on all matters
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-[#0072CE] transition-colors">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="appointmentType"
                        value="instructional"
                        checked={proxyData.appointmentType === 'instructional'}
                        onChange={(e) => setProxyData({...proxyData, appointmentType: e.target.value})}
                        className="w-4 h-4 text-[#0072CE] border-gray-300 focus:ring-[#0072CE] mt-1"
                      />
                      <div>
                        <div className="font-medium text-gray-900">Instructional Proxy</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Your proxy holder must vote according to your specific instructions
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    General Voting Instructions
                  </label>
                  <textarea
                    rows={4}
                    value={proxyData.votingInstructions}
                    onChange={(e) => setProxyData({...proxyData, votingInstructions: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
                    placeholder="Any general instructions for your proxy holder..."
                  />
                </div>
              </motion.div>
            )}

            {/* Step 3: Specific Voting Instructions */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <MessageSquare className="h-12 w-12 text-[#0072CE] mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Voting Instructions</h3>
                  <p className="text-gray-600">
                    {proxyData.appointmentType === 'instructional' 
                      ? 'Specify how you want your proxy to vote on each item'
                      : 'Optional: Provide guidance for your proxy holder'
                    }
                  </p>
                </div>

                {proxyData.appointmentType === 'instructional' && (
                  <div className="space-y-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                        <div className="text-sm text-yellow-800">
                          <strong>Instructional Proxy:</strong> Your proxy holder must vote exactly as you specify below.
                        </div>
                      </div>
                    </div>

                    {/* Voting Items */}
                    <div className="space-y-4">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">1. 2025 Trustee Remuneration</h4>
                        <div className="flex space-x-4">
                          {['yes', 'no', 'abstain'].map((option) => (
                            <label key={option} className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name="trusteeRemuneration"
                                value={option}
                                checked={proxyData.trusteeRemuneration === option}
                                onChange={(e) => setProxyData({...proxyData, trusteeRemuneration: e.target.value})}
                                className="w-4 h-4 text-[#0072CE] border-gray-300 focus:ring-[#0072CE]"
                              />
                              <span className="capitalize text-gray-700">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">2. Trustee Remuneration Policy</h4>
                        <div className="flex space-x-4">
                          {['yes', 'no', 'abstain'].map((option) => (
                            <label key={option} className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name="remunerationPolicy"
                                value={option}
                                checked={proxyData.remunerationPolicy === option}
                                onChange={(e) => setProxyData({...proxyData, remunerationPolicy: e.target.value})}
                                className="w-4 h-4 text-[#0072CE] border-gray-300 focus:ring-[#0072CE]"
                              />
                              <span className="capitalize text-gray-700">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">3. Appointment of Auditors for 2025</h4>
                        <div className="flex space-x-4">
                          {['yes', 'no', 'abstain'].map((option) => (
                            <label key={option} className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name="auditorsAppointment"
                                value={option}
                                checked={proxyData.auditorsAppointment === option}
                                onChange={(e) => setProxyData({...proxyData, auditorsAppointment: e.target.value})}
                                className="w-4 h-4 text-[#0072CE] border-gray-300 focus:ring-[#0072CE]"
                              />
                              <span className="capitalize text-gray-700">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">4. Motions presented at the AGM</h4>
                        <div className="flex space-x-4">
                          {['yes', 'no', 'abstain'].map((option) => (
                            <label key={option} className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name="agmMotions"
                                value={option}
                                checked={proxyData.agmMotions === option}
                                onChange={(e) => setProxyData({...proxyData, agmMotions: e.target.value})}
                                className="w-4 h-4 text-[#0072CE] border-gray-300 focus:ring-[#0072CE]"
                              />
                              <span className="capitalize text-gray-700">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Instructions (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={proxyData.specialInstructions}
                    onChange={(e) => setProxyData({...proxyData, specialInstructions: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
                    placeholder="Any additional instructions or considerations..."
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <button
                onClick={prevStep}
                disabled={step === 1}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex space-x-3">
                {step < 3 ? (
                  <button
                    onClick={nextStep}
                    className="px-6 py-2 bg-[#0072CE] text-white rounded-lg hover:bg-[#005bb5] transition-colors"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !proxyData.proxyHolderName || !proxyData.proxyHolderEmail}
                    className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Complete Assignment</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ProxyAssignmentModal;