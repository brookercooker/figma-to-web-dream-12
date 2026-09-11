import { TeamMember, getInitials } from "@/data/team";

type Props = {
  member: TeamMember;
  className?: string;
};

const TeamPortrait = ({ member, className = "" }: Props) => {
  return (
    <div
      className={`aspect-[4/5] w-full overflow-hidden rounded-lg bg-sand/40 ${className}`}
    >
      {member.photo ? (
        <img
          src={member.photo}
          alt={`Portrait of ${member.name}, ${member.role} at Nova Lighting`}
          loading="lazy"
          className="h-full w-full object-cover"
          style={member.photoPosition ? { objectPosition: member.photoPosition } : undefined}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sand/60 to-cream">
          <span className="font-serif text-5xl sm:text-6xl font-light text-ink/40">
            {getInitials(member.name)}
          </span>
        </div>
      )}
    </div>
  );
};

export default TeamPortrait;
