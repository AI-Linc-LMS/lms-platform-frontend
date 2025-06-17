import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Assessment: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [touched, setTouched] = useState<{ name: boolean, email: boolean, phone: boolean }>({ name: false, email: false, phone: false });

  const handleStartAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, phone: true });
    if (name && email && phone) {
      navigate('/assessment/quiz');
    }
  };

  const isEmailValid = (email: string) => /.+@.+\..+/.test(email);
  const isPhoneValid = (phone: string) => phone.length >= 8;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-2 py-8">
      <div className="w-full max-w-md flex flex-col items-center">
        {/* Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-[#B8E6F0] rounded-full flex items-center justify-center">
            <svg width="63" height="66" viewBox="0 0 63 66" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M26.7631 0.0622874H33.2368C38.8676 0.0622388 43.3277 0.0622001 46.8182 0.531488C50.4104 1.01446 53.318 2.03205 55.611 4.32502C56.5084 5.22244 56.5084 6.67744 55.611 7.57485C54.7135 8.47227 53.2585 8.47227 52.3611 7.57485C51.0644 6.27815 49.2884 5.50091 46.2058 5.08646C43.057 4.66313 38.9064 4.65825 33.0639 4.65825H26.936C21.0935 4.65825 16.9429 4.66313 13.7941 5.08646C10.7115 5.50091 8.93549 6.27815 7.63879 7.57485C6.34208 8.87156 5.56485 10.6476 5.1504 13.7302C4.72706 16.8789 4.72218 21.0296 4.72218 26.872V39.1279C4.72218 44.9704 4.72706 49.121 5.1504 52.2698C5.56485 55.3524 6.34208 57.1284 7.63879 58.4251C8.93549 59.7218 10.7115 60.4991 13.7941 60.9135C16.9429 61.3369 21.0935 61.3417 26.936 61.3417H33.0639C38.9064 61.3417 43.057 61.3369 46.2058 60.9135C49.2884 60.4991 51.0644 59.7218 52.3611 58.4251C54.4935 56.2928 55.1391 52.9796 55.2513 45.2226C55.2697 43.9536 56.3133 42.9398 57.5823 42.9581C58.8513 42.9765 59.8652 44.0201 59.8468 45.2891C59.7392 52.7268 59.2578 58.0281 55.611 61.675C53.318 63.9679 50.4104 64.9855 46.8182 65.4685C43.3277 65.9378 38.8676 65.9377 33.2368 65.9377H26.7631C21.1323 65.9377 16.6723 65.9378 13.1817 65.4685C9.58947 64.9855 6.68192 63.9679 4.38895 61.675C2.09599 59.382 1.07839 56.4744 0.595423 52.8822C0.126134 49.3917 0.126173 44.9316 0.126222 39.3008V26.6992C0.126173 21.0683 0.126134 16.6083 0.595423 13.1178C1.07839 9.52554 2.09599 6.61798 4.38895 4.32502C6.68192 2.03205 9.58947 1.01446 13.1817 0.531488C16.6723 0.0622001 21.1323 0.0622388 26.7631 0.0622874ZM48.7305 17.8197C51.9806 14.5696 57.25 14.5696 60.5001 17.8197C63.7502 21.0698 63.7502 26.3393 60.5001 29.5894L45.9299 44.1595C45.1373 44.9524 44.601 45.4888 44.0003 45.9573C43.2937 46.5085 42.5291 46.981 41.7201 47.3666C41.0325 47.6943 40.3129 47.9341 39.2492 48.2884L32.8651 50.4165C31.4555 50.8863 29.9015 50.5195 28.8509 49.4689C27.8003 48.4183 27.4335 46.8643 27.9033 45.4548L29.9885 39.1991C30.003 39.1558 30.0172 39.113 30.0313 39.0707C30.3857 38.007 30.6255 37.2874 30.9532 36.5997C31.3388 35.7907 31.8113 35.0261 32.3625 34.3195C32.831 33.7189 33.3674 33.1826 34.1602 32.39C34.1917 32.3585 34.2237 32.3265 34.2561 32.2941L48.7305 17.8197ZM57.2503 21.0696C55.795 19.6143 53.4356 19.6143 51.9803 21.0696L51.4233 21.6265C51.4535 21.7291 51.4882 21.8382 51.528 21.9529C51.8162 22.7836 52.3631 23.8824 53.4003 24.9196C54.4374 25.9567 55.5362 26.5036 56.3669 26.7918C56.4816 26.8316 56.5907 26.8663 56.6933 26.8965L57.2503 26.3395C58.7055 24.8843 58.7055 22.5248 57.2503 21.0696ZM53.1833 30.4065C52.2093 29.8949 51.1576 29.1766 50.1504 28.1694C49.1432 27.1622 48.4249 26.1105 47.9133 25.1365L37.5059 35.5439C36.5834 36.4665 36.2597 36.7957 35.9865 37.1461C35.6406 37.5895 35.3441 38.0693 35.1021 38.577C34.911 38.9781 34.7612 39.4148 34.3486 40.6525L33.1221 44.332L33.9878 45.1977L37.6673 43.9712C38.905 43.5586 39.3417 43.4089 39.7429 43.2177C40.2505 42.9758 40.7303 42.6792 41.1737 42.3334C41.5241 42.0601 41.8534 41.7364 42.7759 40.8139L53.1833 30.4065ZM15.4461 23.8081C15.4461 22.5389 16.4749 21.5101 17.7441 21.5101H37.6599C38.929 21.5101 39.9579 22.5389 39.9579 23.8081C39.9579 25.0772 38.929 26.1061 37.6599 26.1061H17.7441C16.4749 26.1061 15.4461 25.0772 15.4461 23.8081ZM15.4461 36.064C15.4461 34.7948 16.4749 33.766 17.7441 33.766H25.404C26.6731 33.766 27.702 34.7948 27.702 36.064C27.702 37.3331 26.6731 38.3619 25.404 38.3619H17.7441C16.4749 38.3619 15.4461 37.3331 15.4461 36.064ZM15.4461 48.3199C15.4461 47.0507 16.4749 46.0219 17.7441 46.0219H22.34C23.6092 46.0219 24.638 47.0507 24.638 48.3199C24.638 49.589 23.6092 50.6178 22.34 50.6178H17.7441C16.4749 50.6178 15.4461 49.589 15.4461 48.3199Z" fill="#255C79" />
            </svg>
          </div>
        </div>
        {/* Heading and Subtitle */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 text-center">Take a Pre-assessment</h1>
        <p className="text-gray-600 mb-6 text-center max-w-xs sm:max-w-md">
          This help us to understand where you stand today and create a plan for you
        </p>
        {/* Card Form */}
        <form onSubmit={handleStartAssessment} className="w-full bg-white rounded-xl shadow-md p-6 flex flex-col gap-4">
          <div className="text-left">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={`w-full border rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#255C79] ${touched.name && !name ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="Enter students name"
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, name: true }))}
              required
            />
            {touched.name && !name && <span className="text-xs text-red-500">Name is required</span>}
          </div>
          <div className="text-left">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email<span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              className={`w-full border rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#255C79] ${touched.email && (!email || !isEmailValid(email)) ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="Enter email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, email: true }))}
              required
            />
            {touched.email && !email && <span className="text-xs text-red-500">Email is required</span>}
            {touched.email && email && !isEmailValid(email) && <span className="text-xs text-red-500">Enter a valid email</span>}
          </div>
          <div className="text-left">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number<span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              className={`w-full border rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#255C79] ${touched.phone && (!phone || !isPhoneValid(phone)) ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="Enter phone number"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, phone: true }))}
              required
            />
            {touched.phone && !phone && <span className="text-xs text-red-500">Phone number is required</span>}
            {touched.phone && phone && !isPhoneValid(phone) && <span className="text-xs text-red-500">Enter a valid phone number</span>}
          </div>
          <button
            type="submit"
            className="w-full bg-[#255C79] text-white py-3 rounded-md font-semibold text-base hover:bg-[#1a4a5f] transition-colors duration-200 mt-2"
          >
            Start Assessment
          </button>
        </form>
      </div>
    </div>
  );
};

export default Assessment; 