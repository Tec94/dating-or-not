import { motion } from 'framer-motion'
import { PropsWithChildren, useEffect } from 'react'

interface PageProps extends PropsWithChildren {
  title?: string
}

export default function Page({ children, title }: PageProps) {
  useEffect(() => {
    if (title) {
      document.title = `${title} - Dating or Not`
    }
  }, [title])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ type: 'spring', stiffness: 220, damping: 25 }}
    >
      {children}
    </motion.div>
  )
}


