const ProfilePage = ({ user, onEdit }) => {
  if (!user) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6 pt-20">
      <div className="bg-white shadow-lg rounded-lg p-8 flex flex-col lg:flex-row items-center lg:items-start lg:space-x-8">
        <div className="flex justify-center lg:justify-start mb-6 lg:mb-0">
          <div className="avatar">
            <div className="ring-primary ring-offset-base-100 w-36 h-36 rounded-full ring ring-offset-4">
              <img
                src={user.profileImage || "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"}
                alt="Profile"
              />
            </div>
          </div>
        </div>

        <div className="flex-1">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">{user.name || "Username"}</h2>
          <p className="text-lg text-gray-500">{user.email || "user@example.com"}</p>
          <div className="mt-6 space-y-2 text-gray-700">
            <p><strong className="font-semibold">Age:</strong> {user.age || "Not Provided"}</p>
          </div>
        </div>

        <div>
          <button
            className="btn btn-primary mt-6 lg:mt-0 w-full lg:w-auto"
            onClick={onEdit}
          >
            Edit Profile
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <InfoCard title="Short Description" content={user.description} />
        <InfoCard title="Nationality" content={user.nationality} />
        <InfoCard title="Address" content={user.address} />
        <InfoCard title="Phone No" content={user.phone} />
        <InfoCard title="Area of Interest" content={user.interest} />
        <InfoCard title="Current Profession" content={user.profession} />
      </div>
    </div>
  );
};

const InfoCard = ({ title, content }) => (
  <div className="bg-white shadow-md rounded-lg p-6">
    <h3 className="text-xl font-semibold mb-4">{title}</h3>
    <p className="text-lg text-gray-600">{content || "Not Provided"}</p>
  </div>
);

export default ProfilePage;
