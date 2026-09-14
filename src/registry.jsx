import ThinkingOrbDoc from './elements/ThinkingOrbDoc.jsx'
import FloatingLabelDoc from './elements/FloatingLabelDoc.jsx'
import InlineValidationDoc from './elements/InlineValidationDoc.jsx'
import PasswordStrengthDoc from './elements/PasswordStrengthDoc.jsx'
import OtpInputDoc from './elements/OtpInputDoc.jsx'
import TagInputDoc from './elements/TagInputDoc.jsx'
import SkeletonSwapDoc from './elements/SkeletonSwapDoc.jsx'
import StreamingTextDoc from './elements/StreamingTextDoc.jsx'
import AccordionDoc from './elements/AccordionDoc.jsx'
import StickyHeaderDoc from './elements/StickyHeaderDoc.jsx'
import ReadingProgressDoc from './elements/ReadingProgressDoc.jsx'
import HideOnScrollDoc from './elements/HideOnScrollDoc.jsx'
import PollResultsDoc from './elements/PollResultsDoc.jsx'
import LogoMarqueeDoc from './elements/LogoMarqueeDoc.jsx'
import SwitchDoc from './elements/SwitchDoc.jsx'
import ComboboxDoc from './elements/ComboboxDoc.jsx'
import SidebarDoc from './elements/SidebarDoc.jsx'
import ChatMessageDoc from './elements/ChatMessageDoc.jsx'
import ColorPickerDoc from './elements/ColorPickerDoc.jsx'
import NumberPopInDoc from './elements/NumberPopInDoc.jsx'
import StaggerRevealDoc from './elements/StaggerRevealDoc.jsx'
import TiltCardDoc from './elements/TiltCardDoc.jsx'
import PlusMenuDoc from './elements/PlusMenuDoc.jsx'
import LikeButtonDoc from './elements/LikeButtonDoc.jsx'
import SpinCounterDoc from './elements/SpinCounterDoc.jsx'
import WordStreamDoc from './elements/WordStreamDoc.jsx'
import SpinnersDoc from './elements/SpinnersDoc.jsx'
import GooeyDoc from './elements/GooeyDoc.jsx'
import CopyButtonDoc from './elements/CopyButtonDoc.jsx'
import LoadingButtonDoc from './elements/LoadingButtonDoc.jsx'
import HoldToConfirmDoc from './elements/HoldToConfirmDoc.jsx'
import LikeBurstDoc from './elements/LikeBurstDoc.jsx'
import RippleDoc from './elements/RippleDoc.jsx'
import IconMorphDoc from './elements/IconMorphDoc.jsx'
import PressDepthDoc from './elements/PressDepthDoc.jsx'

// The showcase reads everything from this registry. To add an element:
// vendor its full source into src/elements/<name>/ (no npm packages — the
// site renders from the vendored files and the copy button hands visitors
// the source itself), create its doc component, then register it here.
export const CATEGORIES = [
  {
    id: 'ai-agents',
    name: 'AI & Agents',
    elements: [
      {
        id: 'thinking-orb',
        name: 'Thinking Orb',
        pkg: 'thinking-orbs',
        Doc: ThinkingOrbDoc,
      },
      { id: 'chat-message', name: 'Chat Message', pkg: 'fluidfunctionalism', Doc: ChatMessageDoc },
    ],
  },
  {
    id: 'action-feedback',
    name: 'Action Feedback',
    elements: [
      { id: 'copy-button', name: 'Copy Button', pkg: 'interior.dev', Doc: CopyButtonDoc },
      { id: 'loading-button', name: 'Loading Button', pkg: 'interior.dev', Doc: LoadingButtonDoc },
      { id: 'hold-to-confirm', name: 'Hold to Confirm', pkg: 'interior.dev', Doc: HoldToConfirmDoc },
      { id: 'like-burst', name: 'Like Burst', pkg: 'interior.dev', Doc: LikeBurstDoc },
      { id: 'like-button', name: 'Like Button', pkg: 'transitions.dev', Doc: LikeButtonDoc },
      { id: 'ripple', name: 'Ripple', pkg: 'interior.dev', Doc: RippleDoc },
      { id: 'icon-morph', name: 'Icon Morph', pkg: 'interior.dev', Doc: IconMorphDoc },
      { id: 'press-depth', name: 'Press Depth', pkg: 'interior.dev', Doc: PressDepthDoc },
    ],
  },
  {
    id: 'input',
    name: 'Input',
    elements: [
      { id: 'floating-label', name: 'Floating Label', pkg: 'interior.dev', Doc: FloatingLabelDoc },
      { id: 'inline-validation', name: 'Inline Validation', pkg: 'interior.dev', Doc: InlineValidationDoc },
      { id: 'password-strength', name: 'Password Strength', pkg: 'interior.dev', Doc: PasswordStrengthDoc },
      { id: 'otp-input', name: 'OTP Input', pkg: 'interior.dev', Doc: OtpInputDoc },
      { id: 'tag-input', name: 'Tag Input', pkg: 'interior.dev', Doc: TagInputDoc },
      { id: 'switch', name: 'Switch', pkg: 'fluidfunctionalism', Doc: SwitchDoc },
      { id: 'combobox', name: 'Combobox', pkg: 'fluidfunctionalism', Doc: ComboboxDoc },
      { id: 'color-picker', name: 'Color Picker', pkg: 'fluidfunctionalism', Doc: ColorPickerDoc },
    ],
  },
  {
    id: 'async',
    name: 'Async',
    elements: [
      { id: 'skeleton-swap', name: 'Skeleton Swap', pkg: 'interior.dev', Doc: SkeletonSwapDoc },
      { id: 'streaming-text', name: 'Streaming Text', pkg: 'interior.dev', Doc: StreamingTextDoc },
      { id: 'word-stream', name: 'Word Stream', pkg: 'transitions.dev', Doc: WordStreamDoc },
      { id: 'spinners', name: 'Spinners', pkg: 'loading.dev', Doc: SpinnersDoc },
    ],
  },
  {
    id: 'navigation',
    name: 'Navigation',
    elements: [
      { id: 'accordion', name: 'Accordion', pkg: 'interior.dev', Doc: AccordionDoc },
      { id: 'sidebar', name: 'Sidebar', pkg: 'fluidfunctionalism', Doc: SidebarDoc },
      { id: 'plus-menu', name: 'Plus Menu', pkg: 'transitions.dev', Doc: PlusMenuDoc },
    ],
  },
  {
    id: 'scroll',
    name: 'Scroll',
    elements: [
      { id: 'sticky-header', name: 'Sticky Header', pkg: 'interior.dev', Doc: StickyHeaderDoc },
      { id: 'reading-progress', name: 'Reading Progress', pkg: 'interior.dev', Doc: ReadingProgressDoc },
      { id: 'hide-on-scroll', name: 'Hide on Scroll', pkg: 'interior.dev', Doc: HideOnScrollDoc },
    ],
  },
  {
    id: 'data',
    name: 'Data',
    elements: [
      { id: 'poll-results', name: 'Poll Results', pkg: 'interior.dev', Doc: PollResultsDoc },
      { id: 'spin-counter', name: 'Spin Counter', pkg: 'transitions.dev', Doc: SpinCounterDoc },
    ],
  },
  {
    id: 'content',
    name: 'Content',
    elements: [
      { id: 'logo-marquee', name: 'Logo Marquee', pkg: 'interior.dev', Doc: LogoMarqueeDoc },
      { id: 'number-pop-in', name: 'Number Pop-in', pkg: 'transitions.dev', Doc: NumberPopInDoc },
      { id: 'stagger-reveal', name: 'Stagger Reveal', pkg: 'transitions.dev', Doc: StaggerRevealDoc },
    ],
  },
  {
    id: 'gesture',
    name: 'Gesture',
    elements: [
      { id: 'tilt-card', name: 'Tilt Card', pkg: 'transitions.dev', Doc: TiltCardDoc },
      { id: 'gooey', name: 'Gooey', pkg: 'libraries.dev', Doc: GooeyDoc },
    ],
  },
]

export const ALL_ELEMENTS = CATEGORIES.flatMap((c) =>
  c.elements.map((e) => ({ ...e, category: c.id, categoryName: c.name })),
)
