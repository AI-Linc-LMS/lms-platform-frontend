const EnrolledLeaderBoard = () => {
    return(
        <div className="w-full rounded-3xl bg-white p-4">
            <h1>Leaderboard</h1>
            <p>Let’s see who is on top of the leaderboard.</p>

            <div className="w-full bg-[#DEE2E6] rounded-xl flex flex-row p-4 gap-3">
            <svg width="38" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M21.5 14C21.5 18.1421 18.1421 21.5 14 21.5C9.85786 21.5 6.5 18.1421 6.5 14C6.5 9.85786 9.85786 6.5 14 6.5C18.1421 6.5 21.5 9.85786 21.5 14ZM14 18.3125C14.3106 18.3125 14.5625 18.0606 14.5625 17.75V13.25C14.5625 12.9394 14.3106 12.6875 14 12.6875C13.6894 12.6875 13.4375 12.9394 13.4375 13.25V17.75C13.4375 18.0606 13.6894 18.3125 14 18.3125ZM14 10.25C14.4142 10.25 14.75 10.5858 14.75 11C14.75 11.4142 14.4142 11.75 14 11.75C13.5858 11.75 13.25 11.4142 13.25 11C13.25 10.5858 13.5858 10.25 14 10.25Z" fill="#6C757D"/>
</svg>

<p className="text-[12px] text-[#6C757D]">As you complete modules you will move top of the leaderboard and earn exciting rewards.</p>

            </div>

        </div>
    );
};
export default EnrolledLeaderBoard;