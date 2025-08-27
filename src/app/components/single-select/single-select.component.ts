import { Component, effect, ElementRef, forwardRef, HostListener, input, output, signal } from '@angular/core';
import { Categories } from '../../config/interfaces/general.interface';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-single-select',
  standalone: true,
  imports: [],
  templateUrl: './single-select.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SingleSelectComponent),
      multi: true,
    },
  ],
})
export class SingleSelectComponent implements ControlValueAccessor  {
  options = input<Categories[]>([]);
  selectedValue = input<string|null>('');
  disabled = input<boolean>(false);
  selected = output<string>();

  isOpen = signal(false);
  selectedOption = signal<Categories | null>(null);

  private onChange = (value: string) => {}
  private onTouched = () => {}

  constructor(private readonly elementRef: ElementRef) {

    effect(() => {
      if (this.selectedValue()) {
        this.updateSelectedOption();  
      }
    }, { allowSignalWrites: true });
    
  }

  ngOnInit() {
    this.updateSelectedOption();
  }


  protected updateSelectedOption() {
    this.selectedOption.set(
      this.options().find((o) => o.categoryId === this.selectedValue()) || null
    )
  }


  writeValue(value: string): void {
    this.selectedOption.set(
      this.options().find((o) => o.categoryId === value) || null
    )
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
   // No-op; input() handles it
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    if (!this.disabled()) this.isOpen.set(!this.isOpen());
  }

  selectOption(option: Categories) {
    this.selectedOption.set(option);
    this.onChange(option.categoryId);  // Notify the form
    this.onTouched();                 // Mark as touched
    this.selected.emit(option.categoryId);
    this.isOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (this.isOpen() && !this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }
}