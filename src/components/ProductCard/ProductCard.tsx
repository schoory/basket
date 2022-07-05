import { FC, MouseEvent } from "react"
import { Button } from '@mui/material';

import './ProductCard.scss'

type ProductCardProps = {
  article: number,
  name: string,
  price: number,
  discount: number,
  onDelete: Function,
}

export const ProductCard: FC<ProductCardProps> = ({ article, name, price, discount, onDelete }) => {

  return (
    <article className="product-card">
      <p className="product-card__article">#{ article }</p>
      <p className="product-card__name">{name}</p>
      <div className="product-card__footer">
        {
          discount === 0
            ? <p className="product-card__price">₽ {price}</p>
            : <div className="product-card__price">₽ <p>{ price }</p> <big>{ price - (price * discount) }</big></div>
        }
        <Button color="error" onClick={() => onDelete(article)}>Удалить</Button>
      </div>
    </article>
  )
}