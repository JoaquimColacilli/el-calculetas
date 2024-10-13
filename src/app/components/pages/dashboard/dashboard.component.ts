import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  inject,
  HostListener,
  NgZone,
  ChangeDetectorRef,
  Directive,
} from '@angular/core';

import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';

import * as XLSX from 'xlsx';

import { IconProp } from '@fortawesome/fontawesome-svg-core';

import { MatDialog } from '@angular/material/dialog';

import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule, formatDate } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faCheckCircle,
  fas,
  faTimesCircle,
} from '@fortawesome/free-solid-svg-icons';

import { WeatherService } from '../../../services/weather.service';
import { CurrencyService } from '../../../services/currency.service';
import { FormsModule } from '@angular/forms';

import { NgSelectModule } from '@ng-select/ng-select';

import Swal from 'sweetalert2';

import { FinanceInterface } from '../../../interfaces/finance.interface';
import {
  Category,
  DefaultCategories,
} from '../../../interfaces/category.interface';

import { Card } from '../../../interfaces/card.interface';
import { CardService } from '../../../services/card.service';

import { CategoryService } from '../../../services/category.service';

import { ModalCategoriasComponent } from './modal-categorias/modal-categorias.component';
import { IngresarSueldoComponent } from './ingresar-sueldo/ingresar-sueldo.component';
import { MatTooltipModule } from '@angular/material/tooltip';

import { NumberFormatPipe } from '../../../pipes/number-format.pipe';

// import { ExpensesService } from '../../../services/gastos.service';
import { FinanceService } from '../../../services/finance.service';

import { Auth } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  setDoc,
} from '@angular/fire/firestore';
import { SueldoService } from '../../../services/sueldo.service';
import { SwitchAccountModalComponent } from './account-management/switch-account-modal/switch-account-modal.component';

import { NavbarComponent } from '../../navbar/navbar.component';
import { AsideComponent } from '../../aside/aside.component';
import { ModalWalletComponent } from './modal-wallet/modal-wallet.component';
import { Timestamp, writeBatch } from 'firebase/firestore';
import { AhorroInterface } from '../../../interfaces/ahorro.interface';
import { AhorrosService } from '../../../services/ahorros.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FontAwesomeModule,
    HttpClientModule,
    FormsModule,
    NgSelectModule,
    MatTooltipModule,
    NumberFormatPipe,
    NavbarComponent,
    AsideComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  @ViewChild('categorySelect', { static: true }) categorySelect!: ElementRef;

  authService = inject(AuthService);
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  financeItems: FinanceInterface[] = [];
  userData: any = null;
  totalAmount = 0;
  totalVencidos = 0;
  totalPagados = 0;
  totalPorPagar = 0;
  vencidosCount = 0;
  pagadosCount = 0;
  porPagarCount = 0;
  sueldoIngresado = 0;
  dineroRestante = 0;
  dineroRestanteUSD = 0;
  totalIngresos = 0;
  options = ['Este mes', 'Esta semana', 'Este año'];
  categories: Category[] = [];
  showMonthlySummaryMessage = false;

  currentIndex = 0;
  weatherData: any = null;
  isDay: boolean = false;
  isNight: boolean = false;
  isUserMenuOpen = false;
  isClosing = false;
  dolarBlueCompra: number = 0;
  dolarBlueVenta: number = 0;
  dolarBolsaCompra: number = 0;
  dolarBolsaVenta: number = 0;
  dolarTarjetaCompra: number = 0;
  dolarTarjetaVenta: number = 0;
  dolarCriptoCompra: number = 0;
  dolarCriptoVenta: number = 0;
  addingExpense: boolean = false;
  newExpense: FinanceInterface = this.createEmptyExpense();
  isLoading: boolean = false;
  isLoadingData: boolean = false;
  isRefreshing: boolean = false;
  showNotification: boolean = false;
  showNotificationGastoAdded: boolean = false;
  deletedExpenseName: string = '';
  addedItemName: string = '';
  editedItemName: string = '';

  salaryDetails: Array<{
    amount: number;
    currency: string;
    validForNextMonth: boolean;
    lastModified?: Date;
  }> = [];

  sortOrder: 'asc' | 'desc' = 'desc';
  sortOrderIngreso: 'asc' | 'desc' = 'desc';

  currentDateTime: string = '';
  private intervalId: any;

  searchQuery: string = '';
  selectedCategory: string | { name: string } | null = null;

  isTodayChecked: boolean = true;

  isTarjetaChecked: boolean = false;

  groupedExpenses: { [key: string]: number } = {};

  totalAmountARS = 0;
  totalAmountUSD = 0;
  totalVencidosARS = 0;
  totalPagadosARS = 0;
  totalPorPagarARS = 0;
  totalVencidosUSD = 0;
  totalPagadosUSD = 0;
  totalPorPagarUSD = 0;

  totalIngresosUSD: number = 0;
  totalDineroEnCuentaUSD: number = 0;

  editingIndex: number | null = null;
  currentExpense: FinanceInterface = this.createEmptyExpense();
  isSaveAttempted = false;

  selectAll = false;
  showSelectButton: boolean = false;

  haySeleccionados = false;
  backgroundColor = '#3498db';

  userLocation: string | null = null;

  cardsWithDate: Card[] = [];

  pagoFilterState: 'Todos' | 'Pagado' | 'Por pagar' | 'Vencido' = 'Todos';

  showAllExpenses: boolean = false;
  remainingDays: number = 0;

  selectedSortCriteria: 'timestamp' | 'date' = 'timestamp';

  isCuotasChecked: boolean = false;
  numCuotas: number = 1;
  cuotasArray: number[] = Array.from({ length: 23 }, (_, i) => i + 2);
  selectedExpenses: FinanceInterface[] = [];
  public conversiones: AhorroInterface[] = [];

  constructor(
    private router: Router,
    library: FaIconLibrary,
    private weatherService: WeatherService,
    private currencyService: CurrencyService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private zone: NgZone,
    private el: ElementRef,
    private financeService: FinanceService,
    private categoryService: CategoryService,
    private sueldoService: SueldoService,
    private cardService: CardService,
    private ahorrosService: AhorrosService
  ) {
    library.addIconPacks(fas);
  }

  async ngOnInit(): Promise<void> {
    // Suscribirse al estado del usuario
    this.authService.user$.subscribe({
      next: (user: any) => {
        if (user) {
          // Solo carga los datos cuando hay un usuario autenticado
          this.loadUserData();
          this.loadInitialData();

          const userUid = user.uid;

          this.authService.getUserByUid(userUid).subscribe({
            next: (userData: any) => {
              if (userData && userData.ubicacion) {
                this.userLocation = userData.ubicacion;
                this.getWeatherData();
              } else {
                console.log('Ubicación no configurada en el perfil');
              }
            },
            error: (error: any) => {
              console.error(
                'Error obteniendo datos del usuario desde Firestore:',
                error
              );
            },
          });
        } else {
          // Redirigir al login si no hay usuario
          this.router.navigate(['/login']);
        }
      },
      error: (error: any) => {
        console.error('Error verificando la autenticación del usuario:', error);
        this.router.navigate(['/login']);
      },
    });
  }

  // Mover la carga de datos iniciales a un método separado
  loadInitialData(): void {
    this.calculateTotals();
    this.calculateCounts();
    this.calculateDayOrNight();

    this.loadDollarRates();

    this.updateDateTime();
    this.intervalId = setInterval(() => this.updateDateTime(), 1000);

    this.checkAndUpdateExpensesStatus();
    setInterval(() => {
      this.checkAndUpdateExpensesStatus();
    }, 24 * 60 * 60 * 1000);

    this.setTodayDate();

    this.sortFinanceItems();
    this.updateGroupedExpenses();

    this.loadSalaries();

    this.loadExpenses();

    this.loadUserCategories();

    this.resetSalariesIfNeeded();

    this.loadUserCards();

    this.getCriteriasFromLs();

    this.checkForMonthlySummary();

    this.loadAhorros();

    registerLocaleData(localeEs, 'es-ES');
  }

  descargarExcel(): void {
    const selectedExpenses = this.financeItems.filter((item) => item.selected);
    if (selectedExpenses.length === 0) {
      return;
    }

    // Mapear los datos de los gastos seleccionados a un formato adecuado para Excel
    const excelData = selectedExpenses.map((item) => ({
      Nombre: item.name,
      Valor: item.value,
      Fecha: item.date,
      Estado: item.status,
      Proveedor: item.provider,
      Categoria: this.getCategoryName(item.category),
      Observaciones: item.obs,
    }));

    // Calcular el total gastado
    const totalGastado = selectedExpenses.reduce(
      (sum, item) => sum + parseFloat(item.value),
      0
    );

    // Añadir el total al final de los datos
    excelData.push({
      Nombre: 'Total Gastado',
      Valor: totalGastado.toFixed(2),
      Fecha: '',
      Estado: '',
      Proveedor: '',
      Categoria: '',
      Observaciones: '',
    });

    // Crear una hoja de trabajo de Excel
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(excelData);
    const workbook: XLSX.WorkBook = XLSX.utils.book_new();

    // Aplicar estilo a los encabezados (negrita)
    const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || '');
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;
      worksheet[cellAddress].s = { font: { bold: true } };
    }

    // Formato de moneda para la columna "Valor"
    for (let i = 1; i < excelData.length; i++) {
      const cellAddress = `B${i + 1}`;
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].z = '"$"#,##0.00'; // Formato moneda
      }
    }

    // Agregar la hoja al libro de trabajo
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Gastos');

    // Obtener el mes actual en formato de texto
    const monthNames = [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre',
    ];
    const currentMonth = monthNames[new Date().getMonth()];

    // Generar y descargar el archivo Excel con el nombre del mes actual
    XLSX.writeFile(workbook, `gastos-${currentMonth}.xlsx`);
  }

  descargarResumenMensual(): void {
    // Obtener los gastos del mes actual utilizando tu método
    const monthlyExpenses = this.getExpensesForPreviousMonth();

    if (monthlyExpenses.length === 0) {
      return; // Si no hay gastos, salir de la función
    }

    // Mapear los datos de los gastos a un formato adecuado para Excel
    const excelData = monthlyExpenses.map((item) => ({
      Nombre: item.name,
      Valor: item.value,
      Fecha: item.date,
      Estado: item.status,
      Proveedor: item.provider,
      Categoria: this.getCategoryName(item.category),
      Observaciones: item.obs,
    }));

    // Calcular el total gastado
    const totalGastado = monthlyExpenses.reduce(
      (acc, item) => acc + parseFloat(item.value),
      0
    );

    // Agregar la fila del total al final
    excelData.push({
      Nombre: 'TOTAL',
      Valor: totalGastado.toFixed(2),
      Fecha: '',
      Estado: '',
      Proveedor: '',
      Categoria: '',
      Observaciones: '',
    });

    // Crear la hoja de trabajo de Excel
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(excelData);
    const workbook: XLSX.WorkBook = XLSX.utils.book_new();

    // Agregar la hoja al libro de trabajo
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Gastos');

    // Obtener el mes actual en español (reutilizamos tu lógica de formato de fecha)
    const now = new Date();
    const formattedMonth = formatDate(now, 'MMMM', 'es-ES');

    // Generar y descargar el archivo Excel con el nombre del mes actual
    XLSX.writeFile(workbook, `resumen-gastos-${formattedMonth}.xlsx`);
  }

  getCriteriasFromLs() {
    const savedShowAllExpenses = localStorage.getItem('showAllExpenses');
    const savedSortCriteria = localStorage.getItem('selectedSortCriteria');

    if (savedShowAllExpenses !== null) {
      this.showAllExpenses = savedShowAllExpenses === 'true';
    }

    if (savedSortCriteria === 'timestamp' || savedSortCriteria === 'date') {
      this.selectedSortCriteria = savedSortCriteria;
    }
  }

  checkForMonthlySummary(): void {
    const argentinaTime = new Date().toLocaleString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
    });
    const now = new Date(argentinaTime);
    const day = now.getDate();

    if (day >= 1 && day <= 5) {
      this.showMonthlySummaryMessage = true;
      this.remainingDays = 5 - day;
    } else {
      this.showMonthlySummaryMessage = false;
    }
  }

  private async resetSalariesIfNeeded(): Promise<void> {
    try {
      const isFirstDay = new Date().getDate() === 1;
      if (isFirstDay) {
        await this.sueldoService.resetSalariesAtStartOfMonth().toPromise();
        console.log('Sueldos reiniciados para el nuevo mes.');
      }
    } catch (error) {
      console.error('Error al restablecer sueldos:', error);
    }
  }

  loadUserCategories(): void {
    this.categoryService.getUserCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Error al cargar las categorías:', error);
      },
    });
  }

  loadUserCards(): void {
    this.cardService.getUserCards().subscribe(
      (cards) => {
        this.cardsWithDate = cards.filter((card) => card.date);
      },
      (error) => {
        console.error('Error al cargar las tarjetas:', error);
      }
    );
  }

  getCardName(card: Card): string {
    return card.name || 'Tarjeta';
  }

  toggleCuotas() {
    if (!this.isCuotasChecked) {
      this.numCuotas = 3;
    }
  }

  loadExpenses(): void {
    this.isLoadingData = true;
    this.financeService.getExpenses().subscribe({
      next: (expenses) => {
        this.financeItems = expenses.map((expense) => {
          const numericValue = parseFloat(String(expense.value));
          const formattedValue = this.formatCurrency(numericValue);
          return {
            ...expense,
            value: String(numericValue),
            valueFormatted: formattedValue,
          };
        });

        // Ordenar según el criterio seleccionado
        this.sortExpenses(this.selectedSortCriteria);

        this.updateExpensesStatus();
        this.isLoadingData = false;
      },
      error: (error) => {
        console.error('Error loading expenses:', error);
        this.isLoadingData = false;
      },
    });
  }

  sortExpenses(criteria: 'date' | 'timestamp') {
    this.financeItems.sort((a, b) => {
      let valueA: number;
      let valueB: number;

      if (criteria === 'date') {
        valueA = this.parseDate(a.date).getTime();
        valueB = this.parseDate(b.date).getTime();
      } else if (criteria === 'timestamp') {
        valueA = a.timestamp ? a.timestamp.toDate().getTime() : 0;
        valueB = b.timestamp ? b.timestamp.toDate().getTime() : 0;
      } else {
        return 0;
      }

      return valueB - valueA;
    });
  }

  onSortCriteriaChange() {
    localStorage.setItem('selectedSortCriteria', this.selectedSortCriteria);

    this.sortExpenses(this.selectedSortCriteria);
  }

  formatCurrency(value: number): string {
    // Convertir el valor en string y separar parte entera de decimal
    let [integerPart, decimalPart] = value.toFixed(2).split('.');

    // Formatear la parte entera con puntos para los miles
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return `${integerPart},${decimalPart}`;
  }

  loadSalaries(): void {
    this.sueldoService.getSalaries().subscribe({
      next: (salariesData) => {
        // Verifica que los datos contengan el array de sueldos
        const salaries = salariesData?.salaries || [];

        this.salaryDetails = salaries;

        // Calcular los totales a partir de los sueldos cargados
        this.totalIngresos = 0;
        this.totalIngresosUSD = 0;

        salaries.forEach((salary: any) => {
          if (salary.currency === 'USD') {
            this.totalIngresosUSD += salary.amount;
          } else if (salary.currency === 'ARS') {
            this.totalIngresos += salary.amount;
          }
        });

        this.totalDineroEnCuentaUSD = this.totalIngresosUSD;
        console.log('Total Ingresos ARS:', this.totalIngresos);
        console.log('Total Dinero en Cuenta USD:', this.totalDineroEnCuentaUSD);

        this.calculateDineroRestante();
      },
      error: (error) => {
        console.error('Error al cargar los sueldos desde Firebase:', error);
      },
    });
  }

  parseDateForFinance(expenseDate: string): Date {
    if (expenseDate.includes('-')) {
      // Formato 'YYYY-MM-DD'
      const [year, month, day] = expenseDate.split('-').map(Number);
      return new Date(year, month - 1, day);
    } else if (expenseDate.includes('/')) {
      // Formato 'DD/MM/YYYY'
      const [day, month, year] = expenseDate.split('/').map(Number);
      return new Date(year, month - 1, day);
    } else {
      return new Date('Invalid Date');
    }
  }

  updateExpensesStatus(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalizar "today" a medianoche

    this.financeItems.forEach((expense) => {
      const expenseDate = this.parseDateForFinance(expense.date);
      expenseDate.setHours(0, 0, 0, 0); // Normalizar la fecha del gasto a medianoche

      if (!expense.id) {
        console.warn(
          `El gasto ${expense.name} no tiene un ID. No se actualizará.`
        );
        return;
      }

      if (expense.status === 'Por pagar' && expenseDate < today) {
        expense.status = 'Vencido';
        this.financeService.updateExpense(expense.id, expense).subscribe({
          next: () => {
            console.log(`Gasto ${expense.name} actualizado a 'Vencido'`);
          },
          error: (error) => {
            console.error('Error al actualizar el gasto:', error);
          },
        });
      }
    });
  }

  private getCurrentUserUid(): string | null {
    return this.auth.currentUser?.uid || null;
  }

  createEmptyExpense(): FinanceInterface {
    return {
      isPaid: false,
      status: 'Por pagar',
      date: '',
      value: '',
      name: '',
      provider: '',
      category: '',
      obs: '',
      currency: 'ARS',
      cardId: '',
      nextMonth: false,
      numCuotas: 0,
    };
  }

  // Obtener los gastos del usuario actual
  async getExpenses(): Promise<void> {
    const uid = this.getCurrentUserUid();
    if (!uid) return;

    const gastosCollection = collection(this.firestore, `users/${uid}/gastos`);
    const querySnapshot = await getDocs(gastosCollection);
    this.financeItems = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FinanceInterface[];
    this.cdr.detectChanges();
  }

  // Agregar un nuevo gasto
  addExpense() {
    this.addingExpense = true;
    this.isTodayChecked = true;
    this.toggleTodayDate();
    this.getDisplayDate();
  }

  toggleTarjeta(): void {
    if (this.isTarjetaChecked) {
      this.isTodayChecked = false;
      this.currentExpense.date = '';
      this.currentExpense.cardId = '';
    } else {
      this.currentExpense.cardId = '';
      this.currentExpense.date = '';
    }
  }

  async saveExpense(): Promise<void> {
    this.isSaveAttempted = true;

    // Validar si todos los campos requeridos están llenos
    if (
      !this.currentExpense.name ||
      !this.currentExpense.value ||
      !this.currentExpense.date ||
      !this.currentExpense.provider ||
      !this.currentExpense.category
    ) {
      console.log('Faltan campos obligatorios.');
      return;
    }

    console.log(this.currentExpense.date);
    const validDate = this.formatDateDisplay(this.currentExpense.date);
    if (!validDate) {
      console.error(
        'Fecha inválida antes de guardar:',
        this.currentExpense.date
      );
      return;
    }
    this.currentExpense.date = validDate;

    // Verificar cuotas
    if (this.isCuotasChecked) {
      this.currentExpense.currentCuota = this.currentExpense.currentCuota || 1; // Si no hay cuota actual, inicializarla
      this.currentExpense.numCuotas = this.numCuotas; // Actualizar el número de cuotas con el valor del select
      this.currentExpense.nextMonth = true;
    } else {
      this.currentExpense.currentCuota = 0;
      this.currentExpense.numCuotas = 0;
    }

    // Formatear valor numérico
    this.currentExpense.value = parseFloat(
      this.currentExpense.value.replace(/\./g, '').replace(',', '.')
    ).toFixed(2);

    if (this.currentExpense.isPaid) {
      this.currentExpense.status = 'Pagado';
    }

    try {
      if (this.editingIndex !== null && this.currentExpense.id) {
        if (this.currentExpense.currentCuota) {
          this.isCuotasChecked = true;
        }

        this.showEditExpense(this.currentExpense.name); // Notificación de edición
        this.financeService
          .updateExpense(this.currentExpense.id, this.currentExpense)
          .subscribe({
            next: () => {
              console.log('Gasto actualizado exitosamente');
              this.loadExpenses(); // Recargar los gastos
            },
            error: (error) => {
              console.error('Error al actualizar el gasto:', error);
            },
          });
      } else {
        this.showAddExpense(this.currentExpense.name);
        this.financeService
          .addExpenseToFirebase(this.currentExpense)
          .subscribe({
            next: (docRef) => {
              this.currentExpense.id = docRef.id;
              this.financeItems.unshift({ ...this.currentExpense });
            },
            error: (error) => {
              console.error('Error al agregar el gasto:', error);
            },
          });
      }

      this.calculateTotals();
      this.calculateCounts();
      this.calculateDineroRestante();
      this.updateGroupedExpenses();
      this.cancelAddingExpense();
      this.toggleTodayDate();
      this.loadExpenses(); // Recargar los gastos
    } catch (error) {
      console.error('Error al guardar el gasto:', error);
    }
  }

  formatDateForSave(dateString: string): string | null {
    if (!dateString || typeof dateString !== 'string') {
      return null;
    }

    if (dateString.includes('/')) {
      const [day, month, year] = dateString.split('/');
      if (!day || !month || !year) {
        return null;
      }
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    if (dateString.includes('-')) {
      const [year, month, day] = dateString.split('-');
      if (!year || !month || !day) {
        return null;
      }
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    return null;
  }

  getCardNameById(cardId: string | undefined): string {
    if (!cardId) return '';
    const card = this.cardsWithDate.find((c) => c.id === cardId);
    return card ? this.getCardName(card) : '';
  }

  onCardSelectionChange(): void {
    if (this.isTarjetaChecked && this.currentExpense.cardId) {
      const selectedCard = this.cardsWithDate.find(
        (card) => card.id === this.currentExpense.cardId
      );
      if (
        selectedCard &&
        selectedCard.selectedDay &&
        selectedCard.selectedMonth
      ) {
        const currentYear = new Date().getFullYear();
        const cardDate = new Date(
          currentYear,
          selectedCard.selectedMonth - 1,
          selectedCard.selectedDay
        );
        const formattedCardDate = cardDate.toISOString().split('T')[0];
        this.currentExpense.date = formattedCardDate;
      }
    }
  }

  // Método para convertir una fecha 'YYYY-MM-DD' a 'DD/MM/YYYY'
  convertDateToDDMMYYYY(date: string): string {
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  }

  startEditingExpense(expense: FinanceInterface): void {
    this.addingExpense = true;
    this.editingIndex = this.filteredFinanceItems.indexOf(expense);
    this.currentExpense = { ...expense };

    // Convertir la fecha al formato correcto si es necesario
    if (this.currentExpense.date.includes('/')) {
      const [day, month, year] = this.currentExpense.date.split('/');
      this.currentExpense.date = `${year}-${month.padStart(
        2,
        '0'
      )}-${day.padStart(2, '0')}`;
    }

    // Ajustar el checkbox según la fecha
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = this.parseDate(this.currentExpense.date);
    this.isTodayChecked = selectedDate.getTime() === today.getTime();
  }

  togglePagoFilter(): void {
    if (this.pagoFilterState === 'Todos') {
      this.pagoFilterState = 'Pagado';
    } else if (this.pagoFilterState === 'Pagado') {
      this.pagoFilterState = 'Por pagar';
    } else if (this.pagoFilterState === 'Por pagar') {
      this.pagoFilterState = 'Vencido';
    } else if (this.pagoFilterState === 'Vencido') {
      this.pagoFilterState = 'Todos';
    }
  }

  getPagoFilterButtonClass(): string {
    if (this.pagoFilterState === 'Pagado') {
      return 'bg-green-500 hover:bg-green-600';
    } else if (this.pagoFilterState === 'Por pagar') {
      return 'bg-yellow-500 hover:bg-yellow-600';
    } else if (this.pagoFilterState === 'Vencido') {
      return 'bg-red-500 hover:bg-red-600';
    } else {
      return 'bg-gray-500 hover:bg-gray-600';
    }
  }

  // Eliminar un gasto
  async deleteExpense(expense: FinanceInterface): Promise<void> {
    const uid = this.getCurrentUserUid();
    if (!uid || !expense.id) return;

    try {
      const deletedAt = this.getTodayDate();

      // Mover a papelera temporal
      const trashDoc = doc(
        this.firestore,
        `users/${uid}/papeleraTemporal/${expense.id}`
      );
      await setDoc(trashDoc, {
        ...expense,
        deletedAt: deletedAt,
      });

      // Eliminar de la colección de gastos
      const expenseDoc = doc(
        this.firestore,
        `users/${uid}/gastos/${expense.id}`
      );
      await deleteDoc(expenseDoc);

      // Eliminar en 'expensesNextMonth' usando el mismo id
      const nextMonthDocRef = doc(
        this.firestore,
        `users/${uid}/expensesNextMonth/${expense.id}`
      );
      await deleteDoc(nextMonthDocRef);

      // Recargar los gastos y mostrar notificación
      this.loadExpenses();
      this.showDeleteNotification(expense.name);
    } catch (error) {
      console.error('Error al eliminar el gasto:', error);
    }
  }

  toggleShowAllExpenses(): void {
    this.showAllExpenses = !this.showAllExpenses;
    localStorage.setItem('showAllExpenses', String(this.showAllExpenses));

    this.loadExpenses();
  }

  getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const menuElement = document.querySelector('.user-menu');
    const iconElement = document.querySelector('.icon-menu-toggle');

    if (
      this.isUserMenuOpen &&
      !menuElement?.contains(target) &&
      !iconElement?.contains(target)
    ) {
      this.closeUserMenu();
    }
  }

  updateGroupedExpenses() {
    this.groupedExpenses = this.financeItems.reduce((acc, item) => {
      // Convertir item.value a string antes de aplicar replace
      const value = parseFloat(String(item.value).replace(/[\$,]/g, ''));
      if (!acc[item.currency]) {
        acc[item.currency] = 0;
      }
      acc[item.currency] += value;
      return acc;
    }, {} as { [key: string]: number });
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }

  get countSelectedItemsThisMonth(): number {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // Mes actual (0 es enero)

    return this.financeItems.filter((item) => {
      const itemDate = this.parseDateForComparisonCheck(item.date);
      // Asegúrate de comparar correctamente el año y mes
      return (
        item.selected &&
        itemDate.getFullYear() === currentYear &&
        itemDate.getMonth() === currentMonth
      );
    }).length;
  }

  get countSelectedItemsThisWeek(): number {
    const now = new Date();
    const startOfWeek = this.getStartOfWeek(now);
    const endOfWeek = this.getEndOfWeek(now);

    return this.financeItems.filter((item) => {
      const itemDate = this.parseDateForComparisonCheck(item.date);
      return item.selected && itemDate >= startOfWeek && itemDate <= endOfWeek;
    }).length;
  }

  get countSelectedItemsThisYear(): number {
    const now = new Date();
    const currentYear = now.getFullYear();

    return this.financeItems.filter((item) => {
      const itemDate = this.parseDateForComparisonCheck(item.date);
      return item.selected && itemDate.getFullYear() === currentYear;
    }).length;
  }

  get countSelectedItems(): number {
    switch (this.options[this.currentIndex]) {
      case 'Este mes':
        return this.countSelectedItemsThisMonth;
      case 'Esta semana':
        return this.countSelectedItemsThisWeek;
      case 'Este año':
        return this.countSelectedItemsThisYear;
      default:
        return this.financeItems.filter((item) => item.selected).length;
    }
  }

  parseDateForComparisonCheck(dateString: string): Date {
    if (dateString.includes('-')) {
      const dateParts = dateString.split('-');
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      const day = parseInt(dateParts[2], 10);
      return new Date(year, month, day, 0, 0, 0, 0);
    } else if (dateString.includes('/')) {
      const dateParts = dateString.split('/');
      const day = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      const year = parseInt(dateParts[2], 10);
      return new Date(year, month, day, 0, 0, 0, 0);
    }

    return new Date('Invalid Date');
  }

  updateDateTime(): void {
    const now = new Date();
    this.currentDateTime = now.toLocaleString('es-ES', {
      dateStyle: 'full',
      timeStyle: 'medium',
    });
  }

  openModalCategorias(): void {
    this.dialog.open(ModalCategoriasComponent, {
      width: '500px',
      panelClass: 'custom-modal-class',
    });
  }

  openModalWallet(): void {
    this.dialog.open(ModalWalletComponent, {
      width: '500px',
      panelClass: 'custom-modal-class',
      backdropClass: 'custom-backdrop',
    });
  }

  openModalIngresarSueldo(): void {
    const dialogRef = this.dialog.open(IngresarSueldoComponent, {
      width: '500px',
      panelClass: 'custom-modal-class',
      data: {
        dolarBolsaVenta: this.dolarBolsaVenta,
        salaryDetails: this.getSalaryDetails(), // Cargar sueldos actuales
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && Array.isArray(result)) {
        // Sobrescribir los sueldos existentes con los nuevos
        this.salaryDetails = result;

        // Resetear los ingresos totales antes de recalcular
        this.totalIngresos = 0;
        this.totalIngresosUSD = 0;

        // Recalcular ingresos totales con los nuevos valores
        result.forEach((salary) => {
          if (salary.currency === 'USD') {
            this.totalIngresosUSD += salary.amount;
          } else if (salary.currency === 'ARS') {
            this.totalIngresos += salary.amount;
          }
        });

        // Guardar los nuevos ingresos en Firebase
        this.saveSalariesToFirebase(result);

        // Actualizar el total en cuenta
        this.totalDineroEnCuentaUSD = this.totalIngresosUSD;
        console.log('Total Ingresos ARS:', this.totalIngresos);
        console.log('Total Dinero en Cuenta USD:', this.totalDineroEnCuentaUSD);

        this.calculateDineroRestante();
      }
    });
  }

  saveSalariesToFirebase(salaries: any[]): void {
    this.sueldoService.addSalaries(salaries).subscribe({
      next: () => {
        console.log('Sueldo guardado exitosamente en Firebase');
      },
      error: (error) => {
        console.error('Error al guardar sueldo en Firebase:', error);
      },
    });
  }

  getSalaryDetails(): Array<{
    amount: number;
    currency: string;
    validForNextMonth: boolean;
    lastModified?: Date;
  }> {
    return this.salaryDetails.map((detail) => ({
      amount: detail.amount,
      currency: detail.currency,
      validForNextMonth: detail.validForNextMonth,
      lastModified: detail.lastModified
        ? new Date(detail.lastModified)
        : new Date(),
    }));
  }

  toggleSortOrder() {
    this.sortOrder = this.sortOrder === 'desc' ? 'asc' : 'desc';
    this.sortFinanceItems();
  }

  toggleSortOrderIngreso() {
    this.sortOrderIngreso = this.sortOrderIngreso === 'asc' ? 'desc' : 'asc';

    // Llamar al método de ordenamiento
    this.sortFinanceItemsIngreso();
  }

  sortFinanceItemsIngreso() {
    this.financeItems.sort((a, b) => {
      const timestampA = a.timestamp ? a.timestamp.toDate().getTime() : 0;
      const timestampB = b.timestamp ? b.timestamp.toDate().getTime() : 0;

      // Ordenar de acuerdo al orden seleccionado (asc o desc)
      if (this.sortOrderIngreso === 'asc') {
        return timestampA - timestampB; // Orden ascendente
      } else {
        return timestampB - timestampA; // Orden descendente
      }
    });
  }

  sortFinanceItems() {
    this.financeItems.sort((a, b) => {
      const dateA = this.parseDate(a.date).getTime();
      const dateB = this.parseDate(b.date).getTime();

      return this.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  closeUserMenu() {
    this.isUserMenuOpen = false;
    this.isClosing = false;
  }

  onAnimationEnd() {
    if (this.isClosing) {
      this.isUserMenuOpen = false;
      this.isClosing = false;
    }
  }

  reloadRates() {
    this.isRefreshing = true;
    this.isLoading = true;

    setTimeout(() => {
      this.loadDollarRates();
      setTimeout(() => {
        this.isRefreshing = false;
      }, 500);
    }, 200);
  }

  getCountByStatus(status: string): number {
    return this.getFilteredExpenses().filter((item) => item.status === status)
      .length;
  }

  getTotalByCurrency(currency: string): number {
    return this.filteredFinanceItems
      .filter((item) => item.currency === currency)
      .reduce((acc, item) => acc + parseFloat(String(item.value)), 0);
  }

  getTotalByStatusAndCurrency(status: string, currency: string): number {
    return this.getFilteredExpenses()
      .filter((item) => item.status === status && item.currency === currency)
      .reduce((total, item) => total + parseFloat(String(item.value)), 0);
  }

  handleInput(event: any): void {
    let value = event.target.value;

    // Eliminar los puntos y luego manejar el valor normalmente
    let numericValue = value.replace(/\./g, '');

    // Permitir solo números y coma
    numericValue = numericValue.replace(/[^\d,]/g, '');

    // Si existe una coma, separar la parte entera de la decimal
    if (value.includes(',')) {
      let [integerPart, decimalPart] = numericValue.split(',');

      // Limitar la parte decimal a solo dos dígitos
      decimalPart = decimalPart.slice(0, 2);

      // Formatear la parte entera con puntos para miles
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

      // Combinar la parte entera y decimal
      numericValue = `${integerPart},${decimalPart}`;
    } else {
      // Si no hay coma, formatear solo la parte entera
      numericValue = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    // Actualizar el valor del input
    event.target.value = numericValue;
    this.currentExpense.value = numericValue;
  }

  getCurrentMonthItems(): FinanceInterface[] {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    switch (this.options[this.currentIndex]) {
      case 'Este mes':
        return this.financeItems.filter((item) => {
          const itemDate = this.parseDate(item.date);
          // console.log('ESTA mes', itemDate, item.name);
          return (
            itemDate.getFullYear() === currentYear &&
            itemDate.getMonth() === currentMonth
          );
        });

      case 'Este año':
        return this.financeItems.filter((item) => {
          const itemDate = this.parseDate(item.date);
          // console.log('ESTA año');
          return itemDate.getFullYear() === currentYear;
        });

      case 'Esta semana':
        const startOfWeek = this.getStartOfWeek(now);
        const endOfWeek = this.getEndOfWeek(now);
        return this.financeItems.filter((item) => {
          const itemDate = this.parseDate(item.date);
          // console.log('ESTA SEMNA');
          return itemDate >= startOfWeek && itemDate <= endOfWeek;
        });

      default:
        return this.financeItems;
    }
  }

  parseDateForComparison(dateString: string): Date {
    if (dateString.includes('-')) {
      const dateParts = dateString.split('-');
      // Esto asegura que al crear la fecha, se haga a medianoche para evitar problemas con horas.
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1; // Los meses en JS son de 0 a 11
      const day = parseInt(dateParts[2], 10);
      return new Date(year, month, day, 0, 0, 0, 0); // Fecha con la hora 00:00
    } else if (dateString.includes('/')) {
      const dateParts = dateString.split('/');
      const day = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1; // Los meses en JS son de 0 a 11
      const year = parseInt(dateParts[2], 10);
      return new Date(year, month, day, 0, 0, 0, 0); // Fecha con la hora 00:00
    }

    return new Date('Invalid Date'); // Si el formato no es reconocido
  }

  getExpensesForPreviousMonth(): FinanceInterface[] {
    const now = new Date();
    const previousMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const year =
      now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

    return this.financeItems.filter((item) => {
      const itemDate = this.parseDateForComparison(item.date);
      return (
        itemDate.getFullYear() === year && itemDate.getMonth() === previousMonth
      );
    });
  }

  getExpensesForThisMonth(): FinanceInterface[] {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0 es enero, 11 es diciembre

    return this.financeItems.filter((item) => {
      const itemDate = this.parseDateForComparison(item.date); // Usar la nueva función para asegurar que la fecha se compare correctamente
      return (
        itemDate.getFullYear() === currentYear &&
        itemDate.getMonth() === currentMonth
      );
    });
  }

  getExpensesForThisWeek(): FinanceInterface[] {
    const now = new Date();
    const startOfWeek = this.getStartOfWeek(now);
    const endOfWeek = this.getEndOfWeek(now);

    return this.financeItems.filter((item) => {
      const itemDate = this.parseDate(item.date);
      return itemDate >= startOfWeek && itemDate <= endOfWeek;
    });
  }

  getStartOfWeek(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Ajusta para que el lunes sea el inicio
    const startOfWeek = new Date(date.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0); // Normaliza a medianoche
    return startOfWeek;
  }

  getEndOfWeek(date: Date): Date {
    const startOfWeek = this.getStartOfWeek(date);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Fin de semana (domingo)
    endOfWeek.setHours(23, 59, 59, 999);
    return endOfWeek;
  }

  getExpensesForThisYear(): FinanceInterface[] {
    const now = new Date();
    const currentYear = now.getFullYear();

    return this.financeItems.filter((item) => {
      const itemDate = this.parseDate(item.date);
      return itemDate.getFullYear() === currentYear;
    });
  }

  getFilteredExpenses(): FinanceInterface[] {
    let filteredItems: FinanceInterface[] = [];

    if (this.showAllExpenses) {
      // Mostrar todos los gastos si showAllExpenses es true
      filteredItems = this.financeItems;
    } else {
      // Filtrar por mes, semana o año si showAllExpenses es false
      switch (this.options[this.currentIndex]) {
        case 'Este mes':
          filteredItems = this.getExpensesForThisMonth();
          break;
        case 'Esta semana':
          filteredItems = this.getExpensesForThisWeek();
          break;
        case 'Este año':
          filteredItems = this.getExpensesForThisYear();
          break;
        default:
          filteredItems = this.financeItems;
          break;
      }
    }

    // Aplicar filtros de búsqueda y categoría
    const searchQueryLower = this.searchQuery.toLowerCase();
    filteredItems = filteredItems.filter((item) => {
      const matchesSearchQuery = Object.values(item).some((value) =>
        String(value).toLowerCase().includes(searchQueryLower)
      );

      const matchesCategory = this.selectedCategory
        ? typeof this.selectedCategory === 'string'
          ? this.getCategoryName(item.category).toLowerCase() ===
            this.selectedCategory.toLowerCase()
          : this.selectedCategory && 'name' in this.selectedCategory
          ? this.getCategoryName(item.category).toLowerCase() ===
            this.selectedCategory.name.toLowerCase()
          : true
        : true;

      return matchesSearchQuery && matchesCategory;
    });

    // Aplicar filtro por estado de pago si showAllExpenses es false
    if (!this.showAllExpenses && this.pagoFilterState !== 'Todos') {
      filteredItems = filteredItems.filter(
        (item) => item.status === this.pagoFilterState
      );
    }

    // Ordenar los gastos según el criterio seleccionado
    this.sortExpenses(this.selectedSortCriteria);

    return filteredItems;
  }

  // Método para calcular los gastos del mes agrupados por moneda
  getGroupedExpenses(): { [key: string]: number } {
    let filteredItems: FinanceInterface[];

    // Filtrar los gastos según la vista seleccionada
    switch (this.options[this.currentIndex]) {
      case 'Este mes':
        filteredItems = this.getExpensesForThisMonth();
        break;
      case 'Esta semana':
        filteredItems = this.getExpensesForThisWeek();
        break;
      case 'Este año':
        filteredItems = this.getExpensesForThisYear();
        break;
      default:
        filteredItems = this.financeItems;
    }

    // Agrupar los gastos por moneda
    const grouped = filteredItems.reduce((acc, item) => {
      const value = parseFloat(String(item.value));
      if (!acc[item.currency]) {
        acc[item.currency] = 0;
      }
      acc[item.currency] += value;
      return acc;
    }, {} as { [key: string]: number });

    return grouped;
  }

  loadDollarRates() {
    this.currencyService.getDollarRates().subscribe({
      next: (data) => {
        this.dolarBlueCompra = data[1].compra;
        this.dolarBlueVenta = data[1].venta;
        this.dolarBolsaCompra = data[2].compra;
        this.dolarBolsaVenta = data[2].venta;
        this.dolarTarjetaCompra = data[6].compra;
        this.dolarTarjetaVenta = data[6].venta;
        this.dolarCriptoCompra = data[5].compra;
        this.dolarCriptoVenta = data[5].venta;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error obteniendo cotizaciones del dólar:', error);
        this.isLoading = false;
      },
    });
  }

  getWeatherData() {
    if (this.userLocation) {
      const [city, countryCode] = this.userLocation
        .split(',')
        .map((s) => s.trim());
      this.weatherService.getWeather(city, countryCode).subscribe({
        next: (data) => {
          this.weatherData = data;
          this.calculateDayOrNight();
        },
        error: (error) => {
          console.error('Error obteniendo los datos del clima:', error);
        },
      });
    } else {
      console.log('No hay ubicación configurada.');
    }
  }

  calculateDayOrNight(): void {
    if (this.weatherData) {
      const currentTime = new Date().getTime() / 1000;
      const sunrise = this.weatherData.sys.sunrise;
      const sunset = this.weatherData.sys.sunset;

      this.isDay = currentTime >= sunrise && currentTime < sunset;
      this.isNight = currentTime < sunrise || currentTime >= sunset;
    }
  }

  getCardColor(): string {
    const dineroRestanteARS = this.calculateDineroRestante();
    const dineroRestanteUSD =
      this.calculateDineroRestanteUsd() * this.dolarBolsaVenta;

    // Si no hay ningún gasto pagado, retorna color gris
    if (this.dineroEnCuentaEsCero()) {
      return 'from-gray-100 to-gray-200';
    }

    const totalDineroRestante = dineroRestanteARS + dineroRestanteUSD;
    const percentage = (totalDineroRestante / 100000) * 100;

    if (percentage <= 20) {
      return 'from-red-100 to-red-200';
    } else if (percentage <= 50) {
      return 'from-yellow-100 to-yellow-200';
    } else if (percentage <= 80) {
      return 'from-blue-100 to-blue-200';
    } else {
      return 'from-green-100 to-green-200';
    }
  }

  getTextColor(): string {
    const dineroRestanteARS = this.calculateDineroRestante();
    const dineroRestanteUSD =
      this.calculateDineroRestanteUsd() * this.dolarBolsaVenta;

    // Si no hay ningún gasto pagado, retorna texto negro
    if (this.dineroEnCuentaEsCero()) {
      return 'text-black';
    }

    const totalDineroRestante = dineroRestanteARS + dineroRestanteUSD;
    const percentage = (totalDineroRestante / 100000) * 100;

    if (percentage <= 20) {
      return 'text-red-800';
    } else if (percentage <= 50) {
      return 'text-yellow-800';
    } else if (percentage <= 80) {
      return 'text-blue-800';
    } else {
      return 'text-green-800';
    }
  }

  dineroEnCuentaEsCero(): boolean {
    return !this.filteredFinanceItems.some((item) => item.isPaid);
  }

  calculateCounts(): void {
    this.vencidosCount = this.financeItems.filter(
      (item) => item.status === 'Vencido'
    ).length;
    this.pagadosCount = this.financeItems.filter(
      (item) => item.status === 'Pagado'
    ).length;
    this.porPagarCount = this.financeItems.filter(
      (item) => item.status === 'Por pagar'
    ).length;
  }

  calculateDineroRestante(): number {
    // Filtrar los gastos pagados en ARS desde la colección de items
    const gastosPagadosEsteMes = this.financeItems.filter((item) => {
      return item.status === 'Pagado' && item.currency === 'ARS';
    });

    // Sumar los gastos pagados en ARS
    const totalPagadoEsteMes = gastosPagadosEsteMes.reduce(
      (acc, item) => acc + parseFloat(String(item.value)),
      0
    );

    // Sumar o restar según si fue compra o venta en ARS desde la colección de ahorros
    const totalAhorrosArs = this.conversiones.reduce((acc, ahorro) => {
      if (ahorro.isCompra) {
        // Si fue compra, se restan los ARS gastados
        return acc - (ahorro.montoArs || 0);
      } else if (ahorro.isVenta) {
        // Si fue venta, se suman los ARS obtenidos
        return acc + (ahorro.montoArs || 0);
      }
      return acc;
    }, 0);

    // Calcular el dinero restante restando los gastos pagados y considerando las conversiones
    this.dineroRestante =
      this.totalIngresos - totalPagadoEsteMes + totalAhorrosArs;

    return this.dineroRestante;
  }

  loadAhorros(): void {
    this.ahorrosService.getAhorros().subscribe({
      next: (ahorros: any) => {
        this.conversiones = ahorros;
        this.calculateDineroRestanteUsd(); // Calcular después de cargar los ahorros
      },
      error: (error: any) => {
        console.error('Error al cargar ahorros:', error);
      },
    });
  }

  calculateDineroRestanteUsd(): number {
    const now = new Date();

    // Sumar los gastos en USD filtrados
    const totalGastosUsd = this.financeItems
      .filter((item) => {
        const itemDate = this.parseDate(item.date);
        return (
          item.status === 'Pagado' &&
          item.currency === 'USD' &&
          itemDate.getFullYear() === now.getFullYear() &&
          itemDate.getMonth() === now.getMonth()
        );
      })
      .reduce((acc, item) => acc + parseFloat(String(item.value)), 0);

    // Ajustar según las compras y ventas en USD desde la colección de ahorros
    const totalAhorrosUsd = this.conversiones.reduce((acc, ahorro) => {
      if (ahorro.isCompra) {
        // Si fue compra, sumamos los USD comprados
        return acc + (ahorro.montoUsd || 0);
      } else if (ahorro.isVenta) {
        // Si fue venta, restamos los USD vendidos
        return acc - Math.abs(ahorro.montoUsd || 0); // Asegurarnos de restar el valor absoluto de los USD vendidos
      }
      return acc;
    }, 0);

    // El dinero restante en USD es la suma de los ingresos más los ahorros, menos los gastos
    this.dineroRestanteUSD =
      this.totalIngresosUSD + totalAhorrosUsd - totalGastosUsd;

    return this.dineroRestanteUSD;
  }

  calculateTotals(): void {
    // Totales en ARS
    this.totalAmountARS = this.financeItems
      .filter((item) => item.currency === 'ARS')
      .reduce(
        (acc, item) =>
          acc + parseFloat(String(item.value).replace(/[\$,]/g, '')),
        0
      );

    this.totalVencidosARS = this.financeItems
      .filter((item) => item.status === 'Vencido' && item.currency === 'ARS')
      .reduce(
        (acc, item) =>
          acc + parseFloat(String(item.value).replace(/[\$,]/g, '')),
        0
      );

    this.totalPagadosARS = this.financeItems
      .filter((item) => item.status === 'Pagado' && item.currency === 'ARS')
      .reduce(
        (acc, item) =>
          acc + parseFloat(String(item.value).replace(/[\$,]/g, '')),
        0
      );

    this.totalPorPagarARS = this.financeItems
      .filter((item) => item.status === 'Por pagar' && item.currency === 'ARS')
      .reduce(
        (acc, item) =>
          acc + parseFloat(String(item.value).replace(/[\$,]/g, '')),
        0
      );

    // Totales en USD
    this.totalAmountUSD = this.financeItems
      .filter((item) => item.currency === 'USD')
      .reduce(
        (acc, item) =>
          acc + parseFloat(String(item.value).replace(/[\$,]/g, '')),
        0
      );

    this.totalVencidosUSD = this.financeItems
      .filter((item) => item.status === 'Vencido' && item.currency === 'USD')
      .reduce(
        (acc, item) =>
          acc + parseFloat(String(item.value).replace(/[\$,]/g, '')),
        0
      );

    this.totalPagadosUSD = this.financeItems
      .filter((item) => item.status === 'Pagado' && item.currency === 'USD')
      .reduce(
        (acc, item) =>
          acc + parseFloat(String(item.value).replace(/[\$,]/g, '')),
        0
      );

    this.totalPorPagarUSD = this.financeItems
      .filter((item) => item.status === 'Por pagar' && item.currency === 'USD')
      .reduce(
        (acc, item) =>
          acc + parseFloat(String(item.value).replace(/[\$,]/g, '')),
        0
      );

    this.calculateDineroRestante();
  }

  ingresarSueldo(monto: number): void {
    this.sueldoIngresado = monto;
    this.totalIngresos += monto;
    this.calculateDineroRestante();
  }

  loadUserData(): void {
    this.authService.getUserData().subscribe({
      next: (data: any) => {
        this.userData = data;
        console.log(data);
      },
      error: (error: any) => {
        console.error(error);
        console.log(this.userData);
        // this.router.navigate(['/login']);
      },
    });
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }

  hasExpenses(): boolean {
    const groupedExpenses = this.getGroupedExpenses();
    return Object.keys(groupedExpenses).length > 0;
  }

  viewProfile(): void {
    this.router.navigate(['/profile']);
  }

  editProfile(): void {}

  manageAccount(): void {}

  loadFinanceItems(): void {
    this.financeItems = [
      {
        isPaid: true,
        status: 'Pagado',
        date: '07/07/2024',
        value: '1900.00',
        currency: 'ARS',
        name: 'Servicios',
        provider: 'Proveedor A',
        category: 'Gastos administrativos',
        obs: 'N/A',
      },
      {
        isPaid: false,
        status: 'Vencido',
        date: '08/09/2024',
        value: '3200.00',
        currency: 'USD',
        name: 'Juguetes',
        provider: 'Perritones',
        category: 'Compra de productos y suministros',
        obs: 'Urgente',
      },
      {
        isPaid: true,
        status: 'Pagado',
        date: '09/09/2024',
        value: '2800.00',
        currency: 'USD',
        name: 'Comederos',
        provider: 'Cerámica de Maíra',
        category: 'Otros',
        obs: '',
      },
    ];
  }

  togglePayment(item: FinanceInterface): void {
    this.updateExpenseStatus(item);

    // Actualizar en Firebase y recargar los gastos
    setTimeout(async () => {
      await this.updateExpenseInFirebase(item);

      // Recargar los gastos desde Firebase para mantener la consistencia

      // Actualizar cálculos después de recargar los gastos
      this.calculateCounts();
      this.calculateTotals();
    }, 300); // 300ms es suficiente para permitir la animación
  }

  updateExpenseStatus(item: FinanceInterface): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normaliza la fecha de hoy a medianoche

    const itemDate = this.parseDate(item.date);
    itemDate.setHours(0, 0, 0, 0); // Normaliza la fecha del gasto a medianoche

    if (item.isPaid) {
      item.status = 'Pagado';
    } else {
      if (itemDate.getTime() === today.getTime()) {
        item.status = 'Por pagar';
      } else if (itemDate < today) {
        item.status = 'Vencido';
      } else {
        item.status = 'Por pagar';
      }
    }
  }

  getMarcarTodosIcon(): IconProp {
    const selectedItems = this.financeItems.filter((item) => item.selected);
    const allPaid = selectedItems.every((item) => item.isPaid);
    return allPaid ? ['fas', 'thumbs-down'] : ['fas', 'thumbs-up'];
  }

  getMarcarTodosTooltip(): string {
    const selectedItems = this.financeItems.filter((item) => item.selected);
    const allPaid = selectedItems.every((item) => item.isPaid);
    return allPaid ? 'Marcar como no pago' : 'Marcar como pago';
  }

  getMarcarTodosButtonClass(): string {
    const selectedItems = this.financeItems.filter((item) => item.selected);
    const allPaid = selectedItems.every((item) => item.isPaid);

    return allPaid
      ? 'bg-red-500 hover:bg-red-600'
      : 'bg-green-500 hover:bg-green-600';
  }

  getMarcarTodosIconClass(): string {
    const selectedItems = this.financeItems.filter((item) => item.selected);
    const allPaid = selectedItems.every((item) => item.isPaid);

    return allPaid ? 'text-white' : 'text-white';
  }

  async marcarTodosComoPagos() {
    const selectedItems = this.financeItems.filter((item) => item.selected);
    const allPaid = selectedItems.every((item) => item.isPaid);

    const action = allPaid ? 'marcar como no pagos' : 'marcar como pagos';
    const confirmButtonText = allPaid
      ? 'Sí, marcar como no pagos'
      : 'Sí, marcar como pagos';

    const result = await Swal.fire({
      title: `¿Seguro que desea ${action} los gastos seleccionados?`,
      icon: 'warning',
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      confirmButtonText: confirmButtonText,
      width: '400px',
      customClass: {
        title: 'swal-title-small',
      },
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      this.selectAll = false;
      this.haySeleccionados = false;
      const uid = this.getCurrentUserUid();
      if (!uid) return;

      // Prepare batch to update expenses in Firebase
      const batch = writeBatch(this.firestore);

      selectedItems.forEach((expense) => {
        if (!expense.id) return;

        // Update the isPaid and status in the local object
        expense.isPaid = !allPaid;
        this.updateExpenseStatus(expense);

        // Reference to the document in Firestore
        const expenseDocRef = doc(
          this.firestore,
          `users/${uid}/gastos/${expense.id}`
        );

        // Update in batch
        batch.update(expenseDocRef, {
          isPaid: expense.isPaid,
          status: expense.status,
        });
      });

      // Commit the batch
      try {
        await batch.commit();

        // Show success notification
        Swal.fire({
          position: 'top',
          icon: 'success',
          title: `Se han actualizado los gastos seleccionados.`,
          showConfirmButton: false,
          timer: 3000,
          toast: true,
          customClass: {
            popup: 'swal-custom-popup',
          },
        });

        this.calculateCounts();
        this.calculateTotals();
        this.cdr.detectChanges();
      } catch (error) {
        console.error('Error al actualizar los gastos:', error);
      }
    }
  }

  mantenerGastoFijo() {
    const selectedExpenses = this.financeItems.filter((item) => item.selected);

    // Verificar si algún gasto seleccionado tiene cuotas
    const hasCuotas = selectedExpenses.some(
      (expense) => expense.numCuotas && expense.numCuotas > 0
    );

    if (hasCuotas) {
      // Si algún gasto tiene cuotas, mostrar advertencia y salir de la función
      Swal.fire({
        icon: 'error',
        title: 'No se puede marcar como fijo',
        text: 'Uno o más gastos seleccionados tienen cuotas. Debe desmarcar estos gastos para continuar.',
        confirmButtonText: 'Aceptar',
      });
      return;
    }

    // Si no hay gastos con cuotas, continuar con la lógica de marcar como fijo
    selectedExpenses.forEach((expense) => {
      const fixedExpense = { ...expense };

      // Si el gasto ya es fijo, desmarcarlo y eliminarlo de 'gastosFijos'
      if (fixedExpense.isFinanceFijo) {
        fixedExpense.isFinanceFijo = false;

        if (expense.id) {
          this.financeService
            .updateExpenseWithoutTimestamp(expense.id, { isFinanceFijo: false })
            .subscribe(() => {
              console.log(`Gasto desmarcado como fijo: ${expense.name}`);
              this.haySeleccionados = false;

              // Eliminar de 'gastosFijos'
              this.financeService.eliminarGastoFijo(expense).subscribe(() => {
                console.log(`Gasto eliminado de gastosFijos: ${expense.name}`);
              });

              Swal.fire({
                position: 'top',
                icon: 'success',
                title: `Gasto ${expense.name} desmarcado como fijo`,
                showConfirmButton: false,
                timer: 3000,
                toast: true,
                customClass: {
                  popup: 'swal-custom-popup',
                },
              });
            });
        }
      } else {
        const expenseDate = fixedExpense.date.includes('-')
          ? new Date(fixedExpense.date) // Asume formato YYYY-MM-DD
          : (() => {
              const [day, month, year] = fixedExpense.date
                .split('/')
                .map(Number); // Asume formato DD/MM/YYYY
              return new Date(year, month - 1, day);
            })();

        // Ahora sí, sumamos un mes correctamente
        expenseDate.setMonth(expenseDate.getMonth() + 1);

        // Actualizamos el campo 'date' del gasto con el nuevo valor, asegurando el formato YYYY-MM-DD
        fixedExpense.date = expenseDate.toISOString().split('T')[0];

        // Guardar el gasto fijo en la colección 'gastosFijos'
        this.financeService.marcarGastoComoFijo(fixedExpense).subscribe(() => {
          console.log(`Gasto fijo agregado: ${fixedExpense.name}`);
        });

        // Actualizar el gasto en la colección 'gastos'
        if (expense.id) {
          this.financeService
            .updateExpenseWithoutTimestamp(expense.id, { isFinanceFijo: true })
            .subscribe(() => {
              this.haySeleccionados = false;

              console.log(`Gasto actualizado como fijo: ${expense.name}`);
              Swal.fire({
                position: 'top',
                icon: 'success',
                title: `Gasto ${expense.name} marcado como fijo`,
                showConfirmButton: false,
                timer: 3000,
                toast: true,
                customClass: {
                  popup: 'swal-custom-popup',
                },
              });
            });
        }
      }
    });

    this.selectedExpenses = [];
  }

  async eliminarSeleccionados() {
    const countSelectedItems = this.countSelectedItems;

    const result = await Swal.fire({
      title: `¿Seguro que quiere enviar ${countSelectedItems} gasto(s) a la papelera temporal?`,
      icon: 'warning',
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Sí, enviar',
      width: '400px',
      customClass: {
        title: 'swal-title-small',
      },
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      const uid = this.getCurrentUserUid();
      if (!uid) return;

      const deletedAt = this.getTodayDate();
      const selectedItems = this.financeItems.filter((item) => item.selected);

      // Desmarcar todos los checkboxes antes de eliminar
      this.financeItems.forEach((item) => (item.selected = false));
      this.selectAll = false;
      this.haySeleccionados = false;
      this.cdr.detectChanges();

      // Preparar batch para eliminar todos los gastos de una sola vez
      const batch = writeBatch(this.firestore);

      for (const expense of selectedItems) {
        if (!expense.id) continue;

        const trashDocRef = doc(
          this.firestore,
          `users/${uid}/papeleraTemporal/${expense.id}`
        );
        const expenseDocRef = doc(
          this.firestore,
          `users/${uid}/gastos/${expense.id}`
        );

        // Establecer 'selected' a false antes de guardar en la papelera temporal
        const expenseData = {
          ...expense,
          selected: false,
          deletedAt,
        };

        // Mover a papelera temporal con 'selected' en false
        batch.set(trashDocRef, expenseData);

        // Eliminar de gastos
        batch.delete(expenseDocRef);

        // Eliminar de 'expensesNextMonth' por id
        const nextMonthDocRef = doc(
          this.firestore,
          `users/${uid}/expensesNextMonth/${expense.id}`
        );
        batch.delete(nextMonthDocRef);
      }

      // Ejecutar el batch
      try {
        await batch.commit();

        // Actualizar la lista local de gastos
        this.financeItems = this.financeItems.filter(
          (item) => !selectedItems.includes(item)
        );

        // Mostrar notificación de éxito
        Swal.fire({
          position: 'top',
          icon: 'success',
          title: `Se han enviado los ${countSelectedItems} gasto(s) a la papelera temporal.`,
          showConfirmButton: false,
          timer: 3000,
          toast: true,
          customClass: {
            popup: 'swal-custom-popup',
          },
        });

        this.loadExpenses();
      } catch (error) {
        console.error('Error al eliminar los gastos:', error);
      }
    }
  }

  editExpense(expense: FinanceInterface): void {
    const index = this.financeItems.findIndex((item) => item.id === expense.id);
    this.editingIndex = index;
    this.currentExpense = { ...expense };
    this.addingExpense = true;

    // Convertir la fecha del formato dd/MM/yyyy a yyyy-MM-dd si es necesario
    if (this.currentExpense.date && this.currentExpense.date.includes('/')) {
      const [day, month, year] = this.currentExpense.date.split('/');
      this.currentExpense.date = `${year}-${month.padStart(
        2,
        '0'
      )}-${day.padStart(2, '0')}`;
    }

    // Manejar el formato yyyy-MM-dd directamente si ya es válido
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Sin horas, minutos y segundos para comparar correctamente
    const selectedDate = this.parseDate(this.currentExpense.date);

    this.isTodayChecked = selectedDate.getTime() === today.getTime();

    // Verificar si es un gasto con tarjeta
    this.isTarjetaChecked = !!expense.cardId;
    if (this.isTarjetaChecked && expense.cardId) {
      const selectedCard = this.cardsWithDate.find(
        (card) => card.id === expense.cardId
      );
      if (
        selectedCard &&
        selectedCard.selectedDay &&
        selectedCard.selectedMonth
      ) {
        const currentYear = new Date().getFullYear();
        const cardDate = new Date(
          currentYear,
          selectedCard.selectedMonth - 1,
          selectedCard.selectedDay
        );
        const formattedCardDate = cardDate.toISOString().split('T')[0];
        this.currentExpense.date = formattedCardDate;
      }
    }

    // Manejo de cuotas
    this.isCuotasChecked = !!this.currentExpense.numCuotas; // Si tiene numCuotas, marcar el check
    this.numCuotas = this.currentExpense.numCuotas ?? 1; // Si numCuotas es undefined, asignar 1
  }

  async updateExpenseInFirebase(expense: FinanceInterface): Promise<void> {
    const uid = this.getCurrentUserUid();
    if (!uid || !expense.id) return;

    try {
      const expenseDoc = doc(
        this.firestore,
        `users/${uid}/gastos/${expense.id}`
      );
      await updateDoc(expenseDoc, {
        isPaid: expense.isPaid,
        status: expense.status,
      });
      console.log(`Gasto ${expense.name} actualizado en Firebase`);
    } catch (error) {
      console.error('Error al actualizar el gasto en Firebase:', error);
    }
  }

  get filteredFinanceItems(): FinanceInterface[] {
    const searchQueryLower = this.searchQuery.toLowerCase();
    const filteredItems = this.financeItems.filter((item) => {
      const matchesSearchQuery = Object.values(item).some((value) =>
        String(value).toLowerCase().includes(searchQueryLower)
      );
      const matchesCategory = this.selectedCategory
        ? item.category === this.selectedCategory
        : true;
      return matchesSearchQuery && matchesCategory;
    });

    return this.filterByDate(filteredItems);
  }

  openSwitchAccountModal(): void {
    this.dialog.open(SwitchAccountModalComponent, {
      width: '400px',
    });
  }

  filterByDate(items: FinanceInterface[]): FinanceInterface[] {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // Mes actual de 0 (enero) a 11 (diciembre)

    now.setHours(0, 0, 0, 0); // Normalizar la hora

    switch (this.options[this.currentIndex]) {
      case 'Este mes':
        return items.filter((item) => {
          const itemDate = this.parseDate(item.date);
          itemDate.setHours(0, 0, 0, 0);
          return (
            itemDate.getFullYear() === currentYear &&
            itemDate.getMonth() === currentMonth
          );
        });

      case 'Esta semana':
        const currentWeekStart = this.getStartOfWeek(now);
        const currentWeekEnd = this.getEndOfWeek(now);
        return items.filter((item) => {
          const itemDate = this.parseDate(item.date);
          return itemDate >= currentWeekStart && itemDate <= currentWeekEnd;
        });

      case 'Este año':
        return items.filter((item) => {
          const itemDate = this.parseDate(item.date);
          return itemDate.getFullYear() === currentYear;
        });

      default:
        return items;
    }
  }

  parseDate(dateString: string): Date {
    let date;
    if (dateString.includes('-')) {
      // Format 'YYYY-MM-DD'
      const [year, month, day] = dateString.split('-').map(Number);
      date = new Date(year, month - 1, day);
    } else if (dateString.includes('/')) {
      // Format 'DD/MM/YYYY'
      const [day, month, year] = dateString.split('/').map(Number);
      date = new Date(year, month - 1, day);
    } else {
      date = new Date('Invalid Date');
    }
    // Set time components to zero
    date.setHours(0, 0, 0, 0);
    return date;
  }

  previousOption() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else {
      this.currentIndex = this.options.length - 1;
    }
    this.changeView(this.getViewFromIndex(this.currentIndex));
  }

  nextOption() {
    if (this.currentIndex < this.options.length - 1) {
      this.currentIndex++;
    } else {
      this.currentIndex = 0;
    }
    this.changeView(this.getViewFromIndex(this.currentIndex));
  }

  getViewFromIndex(index: number): 'year' | 'month' | 'week' {
    switch (this.options[index]) {
      case 'Este año':
        return 'year';
      case 'Este mes':
        return 'month';
      case 'Esta semana':
        return 'week';
      default:
        return 'month';
    }
  }

  changeView(view: 'year' | 'month' | 'week') {
    this.currentIndex = this.options.indexOf(
      view === 'year'
        ? 'Este año'
        : view === 'month'
        ? 'Este mes'
        : 'Esta semana'
    );

    const visibleItems = this.getCurrentMonthItems();
    visibleItems.forEach((item) => {
      item.selected = false; // Deselecciona cada elemento visible
    });

    this.selectAll = false; // Asegura que selectAll esté siempre en false al cambiar de vista
    this.actualizarEstadoSeleccionados(); // Actualiza el estado de selección
    this.cdr.detectChanges(); // Detecta los cambios
  }

  getCategoryName(category: string | { name: string }): string {
    return typeof category === 'object' ? category.name : category;
  }

  //

  onCheckboxChange() {
    this.selectAll = this.financeItems.every((item) => item.selected);
    this.actualizarEstadoSeleccionados();
  }

  actualizarEstadoSeleccionados() {
    const visibleItems = this.getCurrentMonthItems();
    this.haySeleccionados = visibleItems.some((item) => item.selected);
    // Evita cambiar selectAll a true automáticamente al iniciar la vista
    this.selectAll =
      this.haySeleccionados && visibleItems.every((item) => item.selected);
  }

  toggleSelectAll() {
    this.selectAll = !this.selectAll;

    let visibleItems: FinanceInterface[] = [];

    // Determina los ítems visibles según la vista seleccionada
    switch (this.options[this.currentIndex]) {
      case 'Este mes':
        visibleItems = this.getExpensesForThisMonth();
        break;
      case 'Esta semana':
        visibleItems = this.getExpensesForThisWeek();
        break;
      case 'Este año':
        visibleItems = this.getExpensesForThisYear();
        break;
      default:
        visibleItems = this.financeItems;
        break;
    }

    // Marca o desmarca todos los ítems visibles
    visibleItems.forEach((item) => {
      item.selected = this.selectAll;
    });

    this.actualizarEstadoSeleccionados();
  }

  cancelAddingExpense(): void {
    this.addingExpense = false;
    this.editingIndex = null;
    this.isTarjetaChecked = false;
    this.isCuotasChecked = false;
    this.currentExpense = this.createEmptyExpense();
    this.isSaveAttempted = false;
  }

  checkAndUpdateExpensesStatus(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.financeItems.forEach((item) => {
      const itemDate = this.parseDate(item.date);
      itemDate.setHours(0, 0, 0, 0); // Normalize itemDate
      if (item.status === 'Por pagar' && itemDate < today) {
        item.status = 'Vencido';
      }
    });

    this.calculateCounts();
    this.calculateTotals();
  }

  setTodayDate(): void {
    const today = new Date();
    this.newExpense.date = this.formatDate(today);
  }

  formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  getDisplayDate(): string {
    if (this.isTodayChecked) {
      // Obtener la fecha de hoy correctamente sin cambios de huso horario
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Aseguramos que no haya variación de hora
      return today.toISOString().split('T')[0]; // Formato ISO compatible con el input date
    } else {
      // Asegura que si la fecha tiene formato dd/mm/yyyy, se convierta a yyyy-MM-dd
      if (this.currentExpense.date && this.currentExpense.date.includes('/')) {
        const [day, month, year] = this.currentExpense.date.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      return this.currentExpense.date || '';
    }
  }

  toggleTodayDate() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (this.isTodayChecked) {
      this.isTarjetaChecked = false;
      this.currentExpense.date = today.toISOString().split('T')[0];
    } else {
      const currentDate = this.currentExpense.date;
      if (currentDate !== today.toISOString().split('T')[0]) {
        this.isTodayChecked = false;
      }
    }
  }

  handleDateForExpense(dateString: string | null | undefined): string | null {
    if (!dateString || typeof dateString !== 'string') {
      console.log('Fecha vacía o no válida:', dateString);
      return null;
    }

    if (dateString.includes('/')) {
      const [day, month, year] = dateString.split('/');
      if (!day || !month || !year) {
        console.log('Partes de la fecha inválidas:', { day, month, year });
        return null;
      }
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    if (dateString.includes('-')) {
      const [year, month, day] = dateString.split('-');
      if (!year || !month || !day) {
        console.log('Partes de la fecha inválidas:', { year, month, day });
        return null;
      }
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    console.log('Formato de fecha no reconocido:', dateString);
    return null; // Retornar null si no se reconoce el formato
  }

  formatDateDisplay(dateString: string): string {
    if (!dateString || typeof dateString !== 'string') {
      return 'Fecha inválida';
    }

    // Detectar si la fecha es en formato dd/MM/yyyy
    if (dateString.includes('/')) {
      const [day, month, year] = dateString.split('/');
      if (!day || !month || !year) {
        return 'Fecha inválida';
      }
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }

    // Detectar si la fecha es en formato yyyy-MM-dd
    if (dateString.includes('-')) {
      const [year, month, day] = dateString.split('-');
      if (!year || !month || !day) {
        return 'Fecha inválida';
      }
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
    return 'Fecha inválida';
  }

  formatDateDisplayFor(timestamp: Timestamp | undefined): string {
    if (!timestamp) {
      return 'Fecha no disponible';
    }

    const date = timestamp.toDate();

    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  showDeleteNotification(deletedItemName: string) {
    this.deletedExpenseName = deletedItemName;
    Swal.fire({
      position: 'top',
      icon: 'info',
      title: `Se ha enviado el gasto "${deletedItemName}" a la papelera temporal.`,
      showConfirmButton: false,
      timer: 3000,
      toast: true,
      customClass: {
        popup: 'swal-custom-popup',
      },
    });
  }

  showAddExpense(addedItemName: string) {
    this.addedItemName = addedItemName;
    Swal.fire({
      position: 'top',
      icon: 'info',
      title: `Se ha añadido el gasto "${addedItemName}" correctamente.`,
      showConfirmButton: false,
      timer: 3000,
      toast: true,
      customClass: {
        popup: 'swal-custom-popup',
      },
    });
  }

  showEditExpense(editedItemName: string) {
    this.editedItemName = editedItemName;
    Swal.fire({
      position: 'top',
      icon: 'info',
      title: `Se ha moficiado el gasto "${editedItemName}" correctamente.`,
      showConfirmButton: false,
      timer: 3000,
      toast: true,
      customClass: {
        popup: 'swal-custom-popup',
      },
    });
  }

  // createEmptyExpense(): FinanceInterface {
  //   return {
  //     isPaid: false,
  //     status: 'Por pagar',
  //     date: '',
  //     value: '',
  //     name: '',
  //     provider: '',
  //     category: '',
  //     obs: '',
  //     currency: 'ARS',
  //   };
  // }
}
