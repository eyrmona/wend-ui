import { Component, Prop, h } from '@stencil/core';

export type WendButtonVariant = 'primary' | 'secondary';

@Component({
  tag: 'wend-button',
  styleUrl: '../../../../styles/src/components/wend-button.css',
  shadow: false,
  scoped: true
})
export class WendButton {
  /** Visual style of the button. */
  @Prop() variant: WendButtonVariant = 'primary';

  /** Disables the button. */
  @Prop() disabled = false;

  render() {
    return (
      <button class={{ [this.variant]: true }} disabled={this.disabled}>
        <slot />
      </button>
    );
  }
}
