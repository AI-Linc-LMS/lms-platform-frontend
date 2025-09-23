import { PieChart, Pie, Cell } from 'recharts';
import {useEffect, useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {getHoursSpentData} from "../../../services/dashboardApis.ts";
import {HoursSpentData} from "../utils/interface.constant.ts";
import {useSelector} from "react-redux";
import {RootState} from "../../../redux/store.ts";

const Streak = () => {
    const [progress, setProgress] = useState<number>(0);
    const [streak, setStreak] = useState(0);
    const clientInfo = useSelector((state: RootState) => state.clientInfo);
    const courses = useSelector((state: RootState) => state.courses)

    const { data } = useQuery<HoursSpentData>({
        queryKey: ["hoursSpentData", "30"],
        queryFn: () => getHoursSpentData(clientInfo.data?.id, Number("30")),
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
    });

    useEffect(() => {
        let completedHours = 0;
        let totalHours = 0;
        for(const single of courses.courses) {
            totalHours += single.stats.video.total;
            completedHours += single.stats.video.completed;
        }
        if(totalHours == 0) totalHours = 1
        setProgress(Number(completedHours / totalHours));
    }, [courses]);

    useEffect(() => {
        if (data) {
            const calculateStreak = (hours: number[]): number => {
                let currentStreak = 0;
                for (let i = hours.length - 1; i >= 0; i--) {
                    if (hours[i] > 0.5) {
                        currentStreak++;
                    } else {
                        break;
                    }
                }
                return currentStreak;
            };
            setStreak(calculateStreak(data.hours_spent));
        }
    }, [data]);


    const pieData = [
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
                        data={pieData}
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
