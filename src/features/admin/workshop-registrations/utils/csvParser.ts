import { AttendanceData } from "../types";

export const parseCSVAttendance = (csvText: string): AttendanceData[] => {
  const lines = csvText.split('\n');
  const attendanceData: AttendanceData[] = [];
  
  // Find the "Attendee Details" section
  let attendeeDetailsIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Attendee Details')) {
      attendeeDetailsIndex = i;
      break;
    }
  }
  
  if (attendeeDetailsIndex === -1) {
    // If no "Attendee Details" section found, try to parse as regular CSV
    return parseRegularCSV(csvText);
  }
  
  // Get headers from the line after "Attendee Details"
  const headers = lines[attendeeDetailsIndex + 1].split(',').map(header => header.trim().toLowerCase());
  
  // Parse attendee data starting from the line after headers
  for (let i = attendeeDetailsIndex + 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(',').map(value => value.trim());
    const row: any = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    // Map registration report fields to our AttendanceData interface
    const attendanceRecord: AttendanceData = {
      name: `${row['first name'] || ''} ${row['last name'] || ''}`.trim(),
      email: row['email'] || '',
      phone_number: row['phone'] || row['phone number'] || '',
      workshop_name: row['topic'] || row['workshop name'] || row['course'] || '',
      session_number: row['session'] || row['session number'] || row['session no'] || '',
      attended: row['approval status']?.toLowerCase() === 'approved' || row['attended']?.toLowerCase() === 'yes',
      attendance_date: row['registration time'] || row['date'] || row['attendance date'] || '',
      notes: row['notes'] || row['comments'] || row['remarks'] || ''
    };
    
    // Only add if we have at least name and email
    if (attendanceRecord.name && attendanceRecord.email) {
      attendanceData.push(attendanceRecord);
    }
  }
  
  return attendanceData;
};

const parseRegularCSV = (csvText: string): AttendanceData[] => {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(header => header.trim().toLowerCase());
  
  const attendanceData: AttendanceData[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(',').map(value => value.trim());
    const row: any = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    // Map CSV columns to our AttendanceData interface
    const attendanceRecord: AttendanceData = {
      name: row.name || row['student name'] || row['full name'] || '',
      email: row.email || row['email address'] || '',
      phone_number: row.phone || row['phone number'] || row['mobile'] || '',
      workshop_name: row.workshop || row['workshop name'] || row['course'] || '',
      session_number: row.session || row['session number'] || row['session no'] || '',
      attended: row.attended?.toLowerCase() === 'yes' || row.attended?.toLowerCase() === 'true' || row.present?.toLowerCase() === 'yes',
      attendance_date: row.date || row['attendance date'] || row['date attended'] || '',
      notes: row.notes || row.comments || row.remarks || ''
    };
    
    // Only add if we have at least name and email
    if (attendanceRecord.name && attendanceRecord.email) {
      attendanceData.push(attendanceRecord);
    }
  }
  
  return attendanceData;
};

export const validateCSVFormat = (csvText: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!csvText.trim()) {
    errors.push('CSV file is empty');
    return { isValid: false, errors };
  }
  
  const lines = csvText.split('\n');
  if (lines.length < 2) {
    errors.push('CSV file must have at least a header row and one data row');
    return { isValid: false, errors };
  }
  
  // Check if it's a registration report format
  const hasAttendeeDetails = lines.some(line => line.includes('Attendee Details'));
  
  if (hasAttendeeDetails) {
    // For registration report format, check for required fields in attendee details
    const attendeeDetailsIndex = lines.findIndex(line => line.includes('Attendee Details'));
    if (attendeeDetailsIndex !== -1 && attendeeDetailsIndex + 1 < lines.length) {
      const headers = lines[attendeeDetailsIndex + 1].split(',').map(header => header.trim().toLowerCase());
      const requiredHeaders = ['first name', 'email'];
      
      for (const requiredHeader of requiredHeaders) {
        if (!headers.some(header => header.includes(requiredHeader))) {
          errors.push(`Missing required column: ${requiredHeader}`);
        }
      }
    }
  } else {
    // For regular CSV format
    const headers = lines[0].split(',').map(header => header.trim().toLowerCase());
    const requiredHeaders = ['name', 'email'];
    
    for (const requiredHeader of requiredHeaders) {
      if (!headers.some(header => header.includes(requiredHeader))) {
        errors.push(`Missing required column: ${requiredHeader}`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}; 