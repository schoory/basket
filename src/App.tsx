import { TextField, Button, useMediaQuery } from '@mui/material';
import { ChangeEvent, useEffect, useState } from 'react';
import { TProduct } from './@types';

import './App.scss';
import { ProductCard } from './components/ProductCard/ProductCard';

function App() {

  const [products, setProducts] = useState<TProduct[]>([])
  const [productsWithDiscount, setProductsWithDiscount] = useState(0)
  const [totalPriceWithoutDiscount, setTotalPriceWithoutDiscount] = useState(0)
  const [totalPrice, setTotalPrice] = useState(0)
  const [selectedProduct, setSelectedProduct] = useState<TProduct | null>(null)

  const [formValues, setFormValues] = useState({
    article: 0, name: '', price: 0
  })
  const [formErrors, setFormErrors] = useState({
    article: { isError: false, message: '' }, name: { isError: false, message: '' }, price: { isError: false, message: '' }
  })

  const [discountValue, setDiscountValue] = useState(0)
  const [discountError, setDiscountError] = useState({
    isError: false, message: ''
  })

  const matchesTable = useMediaQuery('(max-width:786px)');

  /**
   * Сохраняет в локальное хранилище пользователя товары
   * @param products Товары
   */
  const saveToLocalStorage = (products: TProduct[]) => {
    localStorage.setItem('_BASKET_', JSON.stringify(products))
  }

  /**
   * Получает из локального хранилища пользователя товары
   */
  const getFromLocalStorage = () => {
    const storageItem = localStorage.getItem('_BASKET_')
    if (storageItem) {
      const products = JSON.parse(storageItem)
      setProducts(products)
    }
  }

  // При загрузке страницы получаем из локального хранилища товары
  useEffect(() => {
    getFromLocalStorage()
  }, [])

  // Изменяет значения формы
  const handleFormValuesChanged = (event: ChangeEvent) => {
    const input = event.target as HTMLInputElement
    setFormValues({ ...formValues, [input.name]: input.value })
  }

  // Подсчитывает общую стоимость со скидкой и без, количество товаров со скидкой при изменении products
  useEffect(() => {
    let productsWithDiscount = 0
    let totalPriceWithoutDiscount = 0
    const totalPrice = products.reduce((previous, item) => {
      if (item.discount !== 0) productsWithDiscount++
      totalPriceWithoutDiscount += +item.price
      return previous + (+item.price - (+item.price * +item.discount))
    }, 0)
    setProductsWithDiscount(productsWithDiscount)
    setTotalPriceWithoutDiscount(totalPriceWithoutDiscount)
    setTotalPrice(totalPrice)
  }, [products])

  /**
   * Валидация значений формы
   * @returns Возвращает `false`, если была найдена ошибка, иначе `true`
   */
  const validateFormValues = (): boolean => {
    // Правила:
    // Идентификатор не отрицательный
    // Название не пустое
    // Стоимость не отрицательная
    // В корзине не может быть двух товаров с одинаковым идентификатором
    const errors = { article: { isError: false, message: '' }, name: { isError: false, message: '' }, price: { isError: false, message: '' } }
    // срабатывает, если ввести значение 'e' в input type="number"
    if (!formValues.article.toString()) {
      errors.article.message = 'Поле обязательно для заполнения'
      errors.article.isError = true
    }
    if (formValues.article < 0) {
      errors.article.message = 'Идентификатор не может быть отрицательным'
      errors.article.isError = true
    }
    if (products.find(product => product.article === +formValues.article)) {
      errors.article.message = 'Этот товар уже добавлен'
      errors.article.isError = true
    }
    if (!formValues.name.trim()) {
      errors.name.message = 'Поле обязательно для заполнения'
      errors.name.isError = true
    }
    if (!formValues.price.toString()) {
      errors.price.message = 'Поле обязательно для заполнения'
      errors.price.isError = true
    }
    if (formValues.price < 0) {
      errors.price.message = 'Цена не может быть отрицательной'
      errors.price.isError = true
    }

    setFormErrors(errors)
    
    if (errors.article.isError || errors.name.isError || errors.price.isError) {
      return false
    } else {
      return true
    }
  }

  /**
   * Добавляет продукт в корзину
   */
  const addProduct = () => {
    if (!validateFormValues()) return 
    const newProducts = [ ...products ]
    newProducts.push({ ...formValues, discount: 0 })
    setProducts(newProducts)
    setFormValues({ article: 0, name: '', price: 0 })
    saveToLocalStorage(newProducts)
  }

  /**
   * Удаляет товар из корзины
   * @param article Идентификатор удаляемого товара
   */
  const deleteProduct = (article: number) => {
    const newProducts = [ ...products ]
    if (article === selectedProduct?.article) setSelectedProduct(null) // если удаляемый артикл совпадает с выбранным товаром, снимаем выделения
    newProducts.splice(newProducts.findIndex(product => product.article === article), 1)
    setProducts(newProducts)
    saveToLocalStorage(newProducts)
  }

  /**
   * Выбирает товар для открытия окна скидок
   * @param article Идентификатор выбранного товара
   */
  const selectProduct = (article: number) => {
    if (selectedProduct && selectedProduct.article === article) {
      return setSelectedProduct(null)
    }
    const product = products.find(item => item.article === article)
    setSelectedProduct(product ? product : null)
    setDiscountValue(product ? product.discount * 100 : 0)
  }

  /**
   * Устанавливает скидку выбранному товару
   */
  const addDiscount = () => {
    // Проверка скидки (0 < скидка <= 100)
    if (discountValue < 0) {
      return setDiscountError({ isError: true, message: 'Скидка меньше 0' })
    }
    if (discountValue > 100) {
      return setDiscountError({ isError: true, message: 'Скидка больше 100' })
    }
    setDiscountError({ isError: false, message: '' })

    if (selectedProduct) {
      const newDiscount = +(discountValue / 100).toFixed(2) // перевод скидки в десятичную дробь
      setSelectedProduct({ ...selectedProduct, discount: newDiscount }) 
      const newProducts = [ ...products ]
      const product = newProducts.find(item => item.article === selectedProduct.article)
      if (product) {
        product.discount = newDiscount
      }
      setProducts(newProducts)
      saveToLocalStorage(newProducts)
    }
  }

  /**
   * Выставляет скидки в 0 у всех товаров
   */
  const clearAllDiscount = () => {
    if (selectedProduct) {
      setSelectedProduct({ ...selectedProduct, discount: 0 }) 
      const newProducts = [ ...products ]
      newProducts.forEach((item) => item.discount = 0)
      setProducts(newProducts)
      setSelectedProduct({ ...selectedProduct, discount: 0 })
      setDiscountValue(0)
      saveToLocalStorage(newProducts)
    }
  }

  // Изменяет значение скидки в input
  const handleChangeDiscount = (event: ChangeEvent) => {
    setDiscountValue(+(event.target as HTMLInputElement).value)
  }

  return (
    <main className="basket">
      <h1 className='basket__title'>Корзина</h1>
      <div className='basket__container'>
        <section className="basket__form">
          <div className='basket__form-inputs'>
            <TextField 
              type='number' 
              id='productArticle' 
              name='article' 
              label='Идентификатор товара' 
              variant='outlined' 
              value={formValues.article}
              onChange={handleFormValuesChanged}
              error={formErrors.article.isError}
              helperText={formErrors.article.isError ? formErrors.article.message : ''}
            />
            <TextField 
              type='text' 
              id='productName' 
              name='name' 
              label='Название' 
              variant='outlined' 
              value={formValues.name}
              onChange={handleFormValuesChanged}
              error={formErrors.name.isError}
              helperText={formErrors.name.isError ? formErrors.name.message : ''}
            />
            <TextField 
              type='number' 
              id='productPrice' 
              name='price' 
              label='Цена товара' 
              variant='outlined' 
              value={formValues.price}
              onChange={handleFormValuesChanged}
              error={formErrors.price.isError}
              helperText={formErrors.price.isError ? formErrors.price.message : ''}
            />
          </div>
          <Button variant='contained' onClick={addProduct}>Добавить</Button>
        </section>
        <section className='basket__table' style={
          !matchesTable
            ? { gridColumn: `${ selectedProduct !== null ? '1/2' : '1/3' }` }
            : { }
        }>
          <div className="basket__table-header">
            <p className="basket__table-count">Всего товаров: <big>{products.length}</big></p>
            {
              totalPrice === totalPriceWithoutDiscount
                ? (
                  <p className="basket__table-price">
                    Общая стоимость:&nbsp;
                    <big>
                      {
                        totalPrice
                      }
                    </big>
                  </p>
                )
                : (
                  <div className="basket__table-price">
                    Общая стоимость:&nbsp;
                    <p>
                      {
                        totalPriceWithoutDiscount
                      }
                    </p>
                    <big>
                      {
                        totalPrice
                      }
                    </big>
                  </div>
                )
            }
          </div>
          <div className="basket__table-body">
            {
              products.length === 0
                ? <p className='basket__table-empty'>Список пуст</p>
                : products.map((item, index) => <ProductCard { ...item } key={item.article} onDelete={deleteProduct} onSelect={selectProduct} />)
            }
          </div>
        </section>
        {
          selectedProduct !== null
            ? (
              <section className="basket__discounts">
                <div className="basket__discounts-wrapper">
                  <p className="basket__discounts-title">Выбранный товар: #{selectedProduct.article}</p>
                  <TextField 
                    type='number' 
                    label="Скидка" 
                    size='small' 
                    value={discountValue}
                    onChange={handleChangeDiscount}
                    inputProps={{ min: 0, max: 100 }}
                    error={discountError.isError}
                    helperText={discountError.isError ? discountError.message : ''}
                    fullWidth={matchesTable}
                  />
                  <Button variant='outlined' size='small' onClick={addDiscount}>Установить скидку</Button>
                </div>
                <Button variant='contained' onClick={clearAllDiscount}>Убрать скидки</Button>
              </section>
            )
            : null
        }
      </div>
    </main>
  );
}

export default App;
