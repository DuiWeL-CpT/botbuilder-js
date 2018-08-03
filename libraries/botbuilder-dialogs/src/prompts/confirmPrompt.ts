/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { TurnContext } from 'botbuilder';
import { Prompt, PromptOptions, PromptValidator } from './prompt';
import * as prompts from 'botbuilder-prompts';

/**
 * Prompts a user to confirm something with a yes/no response. 
 * 
 * @remarks
 * By default the prompt will return to the calling dialog a `boolean` representing the users 
 * selection.
 * 
 * #### Prompt Usage
 * 
 * When used with your bots `DialogSet` you can simply add a new instance of the prompt as a named
 * dialog using `DialogSet.add()`. You can then start the prompt from a waterfall step using either
 * `DialogContext.begin()` or `DialogContext.prompt()`. The user will be prompted to answer a 
 * `yes/no` or `true/false` question and the users response will be passed as an argument to the 
 * callers next waterfall step: 
 * 
 * ```JavaScript
 * const { DialogSet, ConfirmPrompt } = require('botbuilder-dialogs');
 * 
 * const dialogs = new DialogSet();
 * 
 * dialogs.add('confirmPrompt', new ConfirmPrompt());
 * 
 * dialogs.add('confirmCancel', [
 *      async function (dc) {
 *          await dc.prompt('confirmPrompt', `This will cancel your order. Are you sure?`);
 *      },
 *      async function (dc, cancel) {
 *          if (cancel) {
 *              await dc.context.sendActivity(`Order cancelled.`);
 *          }
 *          await dc.end();
 *      }
 * ]);
 * ```
 * 
 * If the users response to the prompt fails to be recognized they will be automatically re-prompted
 * to try again. By default the original prompt is re-sent to the user but you can provide an 
 * alternate prompt to send by passing in additional options:
 * 
 * ```JavaScript
 * await dc.prompt('confirmPrompt', `This will cancel your order. Are you sure?`, { retryPrompt: `Please answer "yes" or "no".` });
 * ```
 * 
 * The prompts retry logic can also be completely customized by passing the prompts constructor a 
 * custom validator:
 * 
 * ```JavaScript
 * dialogs.add('confirmPrompt', new ConfirmPrompt(async (context, value) => {
 *    if (typeof confirmed != 'boolean') {
 *       await context.sendActivity(`Please answer "yes" or "no".`);
 *    }
 *    return confirmed; 
 * }));
 * ```
 * @param O (Optional) output type returned by prompt. This defaults to a boolean `true` or `false` but can be changed by a custom validator passed to the prompt.
 */
export class ConfirmPrompt<O = boolean> extends Prompt {
    private prompt: prompts.ConfirmPrompt<O>;

    /** 
     * Allows for the localization of the confirm prompts yes/no choices to other locales besides 
     * english. 
     * 
     * @remarks
     * The key of each entry is the languages locale code and should be lower cased. A default 
     * fallback set of choices can be specified using a key of '*'. 
     * 
     * ```JavaScript
     * const confirmPrompt = new ConfirmPrompt();
     * 
     * // Configure yes/no choices for english and spanish (default)
     * confirmPrompt.choices['*'] = ['sí', 'no'];
     * confirmPrompt.choices['es'] = ['sí', 'no'];
     * confirmPrompt.choices['en-us'] = ['yes', 'no'];
     * 
     * // Add to dialogs
     * dialogs.add('confirmPrompt', confirmPrompt);
     * ```
     */
    static choices: prompts.ConfirmChoices = { '*': ['yes', 'no'] };

    /**
     * Creates a new `ConfirmPrompt` instance.
     * @param validator (Optional) validator that will be called each time the user responds to the prompt. If the validator replies with a message no additional retry prompt will be sent.  
     * @param defaultLocale (Optional) locale to use if `dc.context.activity.locale` not specified. Defaults to a value of `en-us`.
     */
    constructor(dialogId: string, validator?: PromptValidator<boolean, O>, defaultLocale?: string) {
        super(dialogId, validator);
        this.prompt = prompts.createConfirmPrompt(undefined, defaultLocale);
        this.prompt.choices = ConfirmPrompt.choices;
    }

    /**
     * Sets additional options passed to the `ChoiceFactory` and used to tweak the style of choices 
     * rendered to the user. 
     * @param options Additional options to set. Defaults to `{ includeNumbers: false }`
     */
    public choiceOptions(options: prompts.ChoiceFactoryOptions): this {
        Object.assign(this.prompt.choiceOptions, options);
        return this;
    }

    /**
     * Sets the style of the yes/no choices rendered to the user when prompting.
     * @param listStyle Type of list to render to to user. Defaults to `ListStyle.auto`.
     */
    public style(listStyle: prompts.ListStyle): this {
        this.prompt.style = listStyle;
        return this;
    }
    
    protected async onPrompt(context: TurnContext, state: any, options: PromptOptions, isRetry: boolean): Promise<void> {
        if (isRetry && options.retryPrompt) {
            await this.prompt.prompt(context, options.retryPrompt, options.retrySpeak);
        } else if (options.prompt) {
            await this.prompt.prompt(context, options.prompt, options.speak);
        }
    }

    protected async onRecognize(context: TurnContext, state: any, options: PromptOptions): Promise<O|undefined> {
        return await this.prompt.recognize(context);
    }
}
