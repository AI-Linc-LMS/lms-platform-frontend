import { PieChart, Pie, Cell } from 'recharts';

const Streak = () => {
    const progress = 60;
    const streak = 3;

    const data = [
        { name: 'Progress', value: progress },
        { name: 'Remaining', value: 100 - progress },
    ];

    const COLORS = ['#255C79', '#F3F4F6']; // teal-500, gray-100

    return (
        <div className="bg-white px-2 py-4 rounded-xl flex items-center justify-between w-full mx-auto">
            <div>
                <p className="text-gray-800 text-lg md:mb-2">
                    <span role="img" aria-label="fire">🔥</span> Your Streak: <span className="font-bold">{streak} days</span>
                </p>
                <p className="text-gray-500 text-sm md:text-base text-wrap">
                    Overall Course Progress: {progress}% complete
                </p>
            </div>
            <div className="relative w-20 h-20">
                <PieChart width={80} height={80}>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={28}
                        outerRadius={38}
                        fill="#255C79"
                        paddingAngle={0}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                        stroke="none"
                    >
                        <Cell key={`cell-0`} fill={COLORS[0]} />
                        <Cell key={`cell-1`} fill={COLORS[1]} />
                    </Pie>
                </PieChart>
                <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-xl font-bold text-gray-800">{progress}%</p>
                </div>
            </div>
        </div>
    );
};

export default Streak;
