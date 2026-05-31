import React from 'react';

export type ColorKey = 'blue' | 'green' | 'orange' | 'red';

const colorMap: Record<ColorKey, {
    bg: string; border: string; text: string; iconBg: string; dot: string;
}> = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', iconBg: 'bg-blue-600', dot: 'bg-blue-400' },
    green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600', iconBg: 'bg-green-600', dot: 'bg-green-400' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', iconBg: 'bg-orange-500', dot: 'bg-orange-400' },
    red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', iconBg: 'bg-red-600', dot: 'bg-red-400' },
};

export interface IndicadorProps {
    titulo: string;
    valor: number;
    icono: React.ReactNode;
    color: ColorKey;
    descripcion?: string;
}

const Indicador = React.memo(({ titulo, valor, icono, color, descripcion }: IndicadorProps) => {
    const c = colorMap[color];
    return (
        <div
            className={`
        ${c.bg} ${c.border} border-2 rounded-2xl p-8 relative
        transition-all duration-200 cursor-default
        hover:scale-[1.03] hover:shadow-lg group
      `}
        >
            {/* Icon */}
            <div className={`absolute top-6 right-6 ${c.iconBg} text-white p-3 rounded-xl shadow-sm`}>
                {icono}
            </div>

            {/* Pulse dot */}
            <span className={`absolute top-7 right-7 w-2 h-2 rounded-full ${c.dot} opacity-0 group-hover:opacity-100 animate-ping transition-opacity`} />

            {/* Content */}
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-3">{titulo}</p>
            <p className={`text-6xl font-black ${c.text} leading-none mb-3`}>{valor}</p>
            {descripcion && (
                <p className="text-sm text-slate-500 font-medium">{descripcion}</p>
            )}
        </div>
    );
});

Indicador.displayName = 'Indicador';

export default Indicador;
