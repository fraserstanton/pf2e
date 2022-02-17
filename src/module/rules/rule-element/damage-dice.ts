import { RuleElementPF2e, RuleElementData } from "./";
import { CharacterPF2e, NPCPF2e } from "@actor";
import { DamageDiceOverride, DamageDicePF2e } from "@module/modifiers";
import { ItemPF2e } from "@item";
import { RuleElementSource } from "./data";
import { isObject } from "@util";
import { DamageType } from "@module/damage-calculation";
import { DamageDieSize } from "@system/damage/damage";

/**
 * @category RuleElement
 */
export class DamageDiceRuleElement extends RuleElementPF2e {
    constructor(data: DamageDiceSource, item: Embedded<ItemPF2e>) {
        super(data, item);

        if (typeof data.selector !== "string" || data.selector.length === 0) {
            this.failValidation("Missing selector property");
        }
        if ("override" in data && !isObject(data.override)) {
            this.failValidation("The override property must be an object");
        }
    }

    override beforePrepareData(): void {
        if (this.ignored) return;

        this.data.diceNumber = Number(this.resolveValue(this.data.diceNumber));
        const data = deepClone(this.data);
        if (this.data.value) {
            const bracketed = this.resolveValue(this.data.value);
            mergeObject(data, bracketed, { inplace: true, overwrite: true });
            delete data.value;
        }
        const selector = this.resolveInjectedProperties(data.selector);
        // In English (and in other languages when the same general form is used), labels patterned as
        // "Title: Subtitle (Parenthetical)" will be reduced to "Subtitle"
        // e.g., "Spell Effect: Ooze Form (Gelatinous Cube)" will become "Ooze Form"
        data.label = this.label.replace(/^[^:]+:\s*|\s*\([^)]+\)$/g, "");
        data.slug = this.data.slug;

        data.damageType &&= this.resolveInjectedProperties(data.damageType);
        if (data.override) {
            data.override.damageType &&= this.resolveInjectedProperties(data.override.damageType) as DamageType;
            data.override.dieSize &&= this.resolveInjectedProperties(data.override.dieSize) as DamageDieSize;
        }

        const dice = new DamageDicePF2e(data as Required<DamageDiceData>);
        const synthetics = (this.actor.synthetics.damageDice[selector] ??= []);
        synthetics.push(dice);
    }
}

export interface DamageDiceRuleElement {
    data: DamageDiceData;

    get actor(): CharacterPF2e | NPCPF2e;
}

interface DamageDiceData extends RuleElementData {
    slug?: string;
    name?: string;
    damageType?: string;
    override?: DamageDiceOverride;
    diceNumber?: number;
}

interface DamageDiceSource extends RuleElementSource {
    name?: unknown;
    damageType?: unknown;
    override?: unknown;
    diceNumber?: unknown;
}
