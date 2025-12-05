// Test script to verify enhanced employee API
import axios from 'axios';

const testEmployeeAPI = async () => {
  try {
    const response = await axios.get('http://localhost:3001/api/admin/employees', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxIiwibmFtZSI6IlNhcmFoIENoZW4iLCJyb2xlSWQiOjAsImlhdCI6MTczNzE5OTc3MCwiZXhwIjoxNzM3MjEzMzcwfQ.7q5i1LFD1CazewEjW2hYd9Q5kvILSjRk38y0lFU6B7I'
      }
    });

    console.log('✅ API Response Success:', response.data.success);
    console.log('📊 Number of employees:', response.data.data.length);
    
    // Display first employee details
    if (response.data.data.length > 0) {
      const emp = response.data.data[0];
      console.log('\n🧑‍💼 First Employee Details:');
      console.log('Name:', emp.name);
      console.log('Position:', emp.position);
      console.log('Department:', emp.department);
      console.log('Avatar URL:', emp.avatar);
      console.log('Email:', emp.email);
      console.log('Phone:', emp.phone_number);
      console.log('Years of Service:', emp.years_of_service);
      console.log('Work Location:', emp.work_location);
      console.log('Employment Status:', emp.employment_status);
      console.log('Reporting Manager:', emp.reporting_manager_name);
      console.log('Performance Rating:', emp.performance_rating);
      console.log('Achievement Count:', emp.achievement_count);
      console.log('Skill Count:', emp.skill_count);
      console.log('Avg Skill Level:', emp.avg_skill_level);
      console.log('Emergency Contact:', emp.emergency_contact_name);
      console.log('Emergency Phone:', emp.emergency_contact_phone);
      console.log('Total Votes:', emp.total_votes);
      console.log('Updated At:', emp.updated_at);
    }

    console.log('\n🔍 Full API Structure:');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
};

testEmployeeAPI();
