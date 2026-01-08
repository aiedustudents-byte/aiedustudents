import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp } from 'lucide-react';
import Card from '../../components/Card';
import { db } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function ViewStudents() {
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    try {
      const studentsSnapshot = await getDocs(collection(db, 'user_profiles'));
      const studentsData = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const studentsWithStats = studentsData.map((student) => {
        // For now, return mock data since we don't have user_progress collection
        return {
          ...student,
          completedCourses: 0,
          averageProgress: 0,
        };
      });

      setStudents(studentsWithStats);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <Card variant="premium" className="overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-warm-brown mb-3">View Student Progress</h1>
              <p className="text-text-secondary text-lg mb-4">Monitor student learning activity and progress</p>
              <div className="flex items-center gap-6 text-sm text-text-secondary">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-warm-brown" />
                  <span>{students.length} Total Students</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span>Progress Tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-warning" />
                  <span>Student Analytics</span>
                </div>
              </div>
            </div>
            <div className="w-24 h-24 bg-warm-brown rounded-2xl flex items-center justify-center animate-pulse-soft shadow-card">
              <Users className="w-12 h-12 text-white" />
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card variant="premium">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-warm-brown rounded-2xl flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-text-primary">{students.length}</p>
              <p className="text-text-secondary">Total Students</p>
            </div>
          </div>
        </Card>
      </motion.div>

      <Card variant="premium" className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-warm-brown/5 border-b border-warm-brown/10">
                <th className="px-6 py-4 text-sm font-bold text-warm-brown uppercase tracking-wider">S.No</th>
                <th className="px-6 py-4 text-sm font-bold text-warm-brown uppercase tracking-wider">Email ID</th>
                <th className="px-6 py-4 text-sm font-bold text-warm-brown uppercase tracking-wider">Time</th>
                <th className="px-6 py-4 text-sm font-bold text-warm-brown uppercase tracking-wider">College ID</th>
                <th className="px-6 py-4 text-sm font-bold text-warm-brown uppercase tracking-wider">College Name</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.length > 0 ? (
                students.map((student, index) => (
                  <tr
                    key={student.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-text-primary font-medium">{index + 1}</td>
                    <td className="px-6 py-4 text-sm text-text-primary">{student.email}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {student.created_at ? new Date(student.created_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-primary">
                      <span className="px-2 py-1 bg-primary-accent/10 text-primary-accent rounded-md font-medium">
                        {student.collegeId || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-primary">{student.collegeName || 'N/A'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-secondary italic">
                    No student data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
