import { Snowflake } from 'lucide-react';
import type { Member } from '../types';

export function BankCard({ member, fullNumber = false }: { member: Member; fullNumber?: boolean }) {
  const number = fullNumber
    ? `2200 2400 1234 ${member.cardLast4}`
    : `2200 24•• •••• ${member.cardLast4}`;

  return (
    <div className="bank-card" aria-label={`Карта ${member.firstName}, заканчивается ${member.cardLast4}`}>
      <div className="bank-card__top">
        <div className="bank-card__brand">
          <strong>Семья+</strong>
          <span>ВТБ Онлайн · семейная карта</span>
        </div>
        <span className="bank-card__chip" aria-hidden="true" />
      </div>
      <div className="bank-card__row">
        <span className="bank-card__number">{number}</span>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M6.5 8.5a6.5 6.5 0 0 1 0 7M10 6a10 10 0 0 1 0 12M13.5 3.5a13.5 13.5 0 0 1 0 17"
            stroke="rgba(255,255,255,.75)"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="bank-card__bottom">
        <span className="bank-card__holder">
          <span>Владелец карты</span>
          <strong>{member.name}</strong>
        </span>
        <span className="bank-card__mir">МИР</span>
      </div>
      {member.frozen && (
        <div className="bank-card__frozen">
          <Snowflake size={22} />
          Карта заморожена
        </div>
      )}
    </div>
  );
}
