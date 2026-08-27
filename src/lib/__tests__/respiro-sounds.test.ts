import { describe, expect, it } from "vitest";
import { getRespiroSound, SOUNDS, RESPIRO_SOUND_IDS } from "@/data/respiro";

describe("respiro sounds", () => {
  it("expõe quatro ambientes com src", () => {
    expect(SOUNDS).toHaveLength(4);
    for (const id of RESPIRO_SOUND_IDS) {
      const sound = getRespiroSound(id);
      expect(sound?.src).toBeTruthy();
      expect(sound?.name.length).toBeGreaterThan(0);
    }
  });
});
