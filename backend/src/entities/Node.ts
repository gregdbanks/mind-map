import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm'
import { MindMap } from './MindMap'

@Entity('nodes')
@Index(['mindMapId'])
@Index(['parentId'])
export class Node {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column()
  mindMapId!: string

  @Column()
  text!: string

  @Column('float')
  positionX!: number

  @Column('float')
  positionY!: number

  @Column('float', { nullable: true })
  width?: number

  @Column('float', { nullable: true })
  height?: number

  @Column({ default: '#ffffff' })
  backgroundColor!: string

  @Column({ default: '#000000' })
  textColor!: string

  @Column({ default: 14 })
  fontSize!: number

  @Column({ default: 'normal' })
  fontWeight!: string

  @Column({ default: 'normal' })
  fontStyle!: string

  @Column({ default: 'none' })
  textDecoration!: string

  @Column({ default: '#cccccc' })
  borderColor!: string

  @Column({ default: 1 })
  borderWidth!: number

  @Column({ default: 4 })
  borderRadius!: number

  @Column({ nullable: true })
  parentId?: string

  @Column({ default: false })
  collapsed!: boolean

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  @ManyToOne(() => MindMap, mindMap => mindMap.nodes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mindMapId' })
  mindMap!: MindMap

  @ManyToOne(() => Node, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent?: Node

  children?: Node[]
}