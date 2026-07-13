import amora from "@/assets/avatar/cabeca/Amora.png";
import chico from "@/assets/avatar/cabeca/Chico.png";
import pipoca from "@/assets/avatar/cabeca/Pipoca.png";
import zeca from "@/assets/avatar/cabeca/Zeca.png";

const AVATARS = [
  { name: "Amora", src: amora },
  { name: "Chico", src: chico },
  { name: "Pipoca", src: pipoca },
  { name: "Zeca", src: zeca },
];

interface AvatarProps {
  name?: string;
  size?: number;
  className?: string;
}

export function Avatar({ name, size = 40, className = "" }: AvatarProps) {
  const avatar = AVATARS.find((a) => a.name === name) ?? AVATARS[Math.floor(Math.random() * AVATARS.length)];

  return (
    <img
      src={avatar.src}
      alt={avatar.name}
      width={size}
      height={size}
      className={`rounded-full object-cover ring-2 ring-white/60 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
