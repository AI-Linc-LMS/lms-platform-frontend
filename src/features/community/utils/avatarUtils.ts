export const getUserAvatar = (name: string, avatar?: string) => {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
  const colors = [
    'bg-gradient-to-br from-blue-500 to-blue-600',
    'bg-gradient-to-br from-green-500 to-green-600',
    'bg-gradient-to-br from-purple-500 to-purple-600',
    'bg-gradient-to-br from-pink-500 to-pink-600',
    'bg-gradient-to-br from-yellow-500 to-yellow-600',
    'bg-gradient-to-br from-indigo-500 to-indigo-600',
    'bg-gradient-to-br from-red-500 to-red-600',
    'bg-gradient-to-br from-teal-500 to-teal-600'
  ];
  const colorIndex = name.length % colors.length;
  return {
    initials,
    color: colors[colorIndex],
    avatar: avatar || null
  };
};
