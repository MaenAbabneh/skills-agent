import { create } from "zustand";

interface UIState {
	selectedSkillId: string | null;
	isHoveringCard: boolean;

	setSelectedSkill: (id: string | null) => void;
	setHoveringCard: (status: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
	selectedSkillId: null,
	isHoveringCard: false,

	setSelectedSkill: (id) => set({ selectedSkillId: id }),
	setHoveringCard: (status) => set({ isHoveringCard: status }),
}));
