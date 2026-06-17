'use client';

import { Plus, Trash2, Award, Calendar, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Badge } from '@shared/ui/data-display/badge';
import { Button } from '@shared/ui/forms/button';
import { Input } from '@shared/ui/forms/input';
import { Label } from '@shared/ui/forms/label';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/layout';
import { PDD_TESTS, type PddTest } from '@entities/users/data/pdd-tests';
import { TestModal } from '@entities/users/ui/modal-sections/test-modal';



interface TestScoreFormData {
  profile: {
    testScore: Array<{
      testName: string;
      score: number;
      maxPossibleScore: number;
      passedDate: string;
      expiryDate?: string | null;
      comments?: string | null;
    }>;
  };
}

export function TestScoreSection() {
  const { register, control, formState: { errors }, watch, setValue } = useFormContext<TestScoreFormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'profile.testScore',
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTest, setActiveTest] = useState<{ testIndex: number; test: PddTest; mode: 'take' | 'manual' } | null>(null);

  const addNewTest = () => {
    append({
      testName: '',
      score: 0,
      maxPossibleScore: 100,
      passedDate: new Date().toISOString().split('T')[0],
      expiryDate: null,
      comments: null,
    });
    setShowAddForm(true);
  };

  const startTest = (testIndex: number, test: PddTest) => {
    setActiveTest({ testIndex, test, mode: 'take' });
  };

  const handleTestComplete = (score: number) => {
    if (!activeTest) return;

    // Сохраняем результат в форму
    setValue(`profile.testScore.${activeTest.testIndex}.testName`, activeTest.test.name);
    setValue(`profile.testScore.${activeTest.testIndex}.score`, score);
    setValue(`profile.testScore.${activeTest.testIndex}.maxPossibleScore`, activeTest.test.maxScore);
    setValue(`profile.testScore.${activeTest.testIndex}.passedDate`, new Date().toISOString().split('T')[0]);
  };

  const closeTest = () => {
    setActiveTest(null);
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;

    if (percentage >= 90) return 'bg-green-100 text-green-800';

    if (percentage >= 70) return 'bg-yellow-100 text-yellow-800';

    return 'bg-red-100 text-red-800';
  };

  const getScoreStatus = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;

    if (percentage >= 90) return 'Отлично';

    if (percentage >= 70) return 'Хорошо';

    return 'Требует улучшения';
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-medium flex items-center gap-2'>
          <Award className='h-5 w-5 text-blue-600' />
          Результаты тестов ПДД
        </h3>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={addNewTest}
          className='flex items-center gap-2'
        >
          <Plus className='h-4 w-4' />
          Добавить тест
        </Button>
      </div>

      {fields.length === 0 && !showAddForm && (
        <Card className='border-dashed'>
          <CardContent className='flex flex-col items-center justify-center py-8 text-center'>
            <Award className='h-12 w-12 text-gray-400 mb-4' />
            <h4 className='text-lg font-medium text-gray-900 mb-2'>Нет результатов тестов</h4>
            <p className='text-gray-500 mb-4'>Добавьте результаты пройденных тестов по ПДД</p>
            <Button
              type='button'
              variant='outline'
              onClick={addNewTest}
              className='flex items-center gap-2'
            >
              <Plus className='h-4 w-4' />
              Добавить первый тест
            </Button>
          </CardContent>
        </Card>
      )}

      <div className='space-y-4'>
        {fields.map((field, index) => {
          const testData = watch(`profile.testScore.${index}`);
          const percentage = testData?.score && testData?.maxPossibleScore
            ? Math.round((testData.score / testData.maxPossibleScore) * 100)
            : 0;

          return (
            <Card key={field.id} className='relative'>
              <CardHeader className='pb-4'>
                <div className='flex items-start justify-between'>
                  <CardTitle className='text-base flex items-center gap-2'>
                    <Award className='h-4 w-4' />
                    Тест #{index + 1}
                  </CardTitle>
                  <div className='flex items-center gap-2'>
                    {testData?.score && testData?.maxPossibleScore && (
                      <Badge className={getScoreColor(testData.score, testData.maxPossibleScore)}>
                        {percentage}% - {getScoreStatus(testData.score, testData.maxPossibleScore)}
                      </Badge>
                    )}
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => remove(index)}
                      className='text-red-600 hover:text-red-700 hover:bg-red-50'
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {/* Выбор теста */}
                  <div className='md:col-span-2 space-y-4'>
                    <Label>Выберите тест ПДД *</Label>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                      {PDD_TESTS.map((test) => {
                        // Проверяем, пройден ли уже этот тест
                        const testData = watch(`profile.testScore.${index}`);
                        const isTestCompleted = testData?.testName === test.name && testData?.score > 0;

                        return (
                          <Card key={test.id} className={`border-2 transition-colors cursor-pointer ${
                            isTestCompleted
                              ? 'border-green-300 bg-green-50'
                              : 'hover:border-blue-300'
                          }`}>
                            <CardContent className='p-4'>
                              <div className='space-y-3'>
                                <div className='relative'>
                                  {isTestCompleted && (
                                    <div className='absolute -top-2 -right-2'>
                                      <div className='bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold'>
                                        ✓
                                      </div>
                                    </div>
                                  )}
                                  <h4 className={`font-medium text-sm ${isTestCompleted ? 'text-green-700' : ''}`}>
                                    {test.name}
                                  </h4>
                                  <p className='text-xs text-gray-500 mt-1'>{test.description}</p>
                                  <div className='flex items-center gap-4 mt-2 text-xs text-gray-400'>
                                    <span>Вопросов: {test.questions.length}</span>
                                    <span>Проходной балл: {test.passingScore}%</span>
                                  </div>
                                  {isTestCompleted && (
                                    <div className='mt-2 text-xs text-green-600 font-medium'>
                                      Результат: {testData.score}/{testData.maxPossibleScore}
                                      ({Math.round((testData.score / testData.maxPossibleScore) * 100)}%)
                                    </div>
                                  )}
                                </div>

                              <div className='flex gap-2'>
                                <Button
                                  type='button'
                                  size='sm'
                                  className={`flex-1 text-xs h-8 ${
                                    isTestCompleted
                                      ? 'bg-green-600 hover:bg-green-700'
                                      : ''
                                  }`}
                                  onClick={() => startTest(index, test)}
                                >
                                  {isTestCompleted ? '� Пересдать' : '�📝 Пройти тест'}
                                </Button>
                                <Button
                                  type='button'
                                  variant='outline'
                                  size='sm'
                                  className='flex-1 text-xs h-8'
                                  onClick={() => {
                                    // Устанавливаем название теста для ручного ввода
                                    setValue(`profile.testScore.${index}.testName`, test.name);
                                    setValue(`profile.testScore.${index}.maxPossibleScore`, test.maxScore);
                                  }}
                                >
                                  ⚡ Ввести балл
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        );
                      })}
                    </div>

                    {/* Скрытое поле для названия теста */}
                    <Input
                      {...register(`profile.testScore.${index}.testName`)}
                      type='hidden'
                    />

                    {errors.profile?.testScore?.[index]?.testName && (
                      <p className='text-sm text-red-500'>
                        {errors.profile.testScore[index]?.testName?.message}
                      </p>
                    )}
                  </div>

                  {/* Баллы */}
                  <div className='space-y-2'>
                    <Label htmlFor={`score-${index}`}>Полученные баллы *</Label>
                    <Input
                      id={`score-${index}`}
                      type='number'
                      min='0'
                      {...register(`profile.testScore.${index}.score`, { valueAsNumber: true })}
                      placeholder='0'
                      className={`focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md focus-visible:shadow-md transition-shadow ${
                        errors.profile?.testScore?.[index]?.score ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.profile?.testScore?.[index]?.score && (
                      <p className='text-sm text-red-500'>
                        {errors.profile.testScore[index]?.score?.message}
                      </p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor={`maxScore-${index}`}>Максимальные баллы *</Label>
                    <Input
                      id={`maxScore-${index}`}
                      type='number'
                      min='1'
                      {...register(`profile.testScore.${index}.maxPossibleScore`, { valueAsNumber: true })}
                      placeholder='100'
                      className={`focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md focus-visible:shadow-md transition-shadow ${
                        errors.profile?.testScore?.[index]?.maxPossibleScore ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.profile?.testScore?.[index]?.maxPossibleScore && (
                      <p className='text-sm text-red-500'>
                        {errors.profile.testScore[index]?.maxPossibleScore?.message}
                      </p>
                    )}
                  </div>

                  {/* Даты */}
                  <div className='space-y-2'>
                    <Label htmlFor={`passedDate-${index}`} className='flex items-center gap-1'>
                      <Calendar className='h-3 w-3' />
                      Дата прохождения *
                    </Label>
                    <Input
                      id={`passedDate-${index}`}
                      type='date'
                      max={new Date().toISOString().split('T')[0]}
                      {...register(`profile.testScore.${index}.passedDate`)}
                      className={`focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md focus-visible:shadow-md transition-shadow ${
                        errors.profile?.testScore?.[index]?.passedDate ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.profile?.testScore?.[index]?.passedDate && (
                      <p className='text-sm text-red-500'>
                        {errors.profile.testScore[index]?.passedDate?.message}
                      </p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor={`expiryDate-${index}`} className='flex items-center gap-1'>
                      <Calendar className='h-3 w-3' />
                      Срок действия
                    </Label>
                    <Input
                      id={`expiryDate-${index}`}
                      type='date'
                      min={new Date().toISOString().split('T')[0]}
                      {...register(`profile.testScore.${index}.expiryDate`)}
                      className='focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md focus-visible:shadow-md transition-shadow'
                    />
                  </div>

                  {/* Комментарии */}
                  <div className='md:col-span-2 space-y-2'>
                    <Label htmlFor={`comments-${index}`} className='flex items-center gap-1'>
                      <MessageSquare className='h-3 w-3' />
                      Комментарии
                    </Label>
                    <textarea
                      id={`comments-${index}`}
                      {...register(`profile.testScore.${index}.comments`)}
                      placeholder='Дополнительные комментарии к результату теста...'
                      rows={3}
                      className='flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md focus-visible:shadow-md transition-shadow resize-none disabled:cursor-not-allowed disabled:opacity-50'
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>



      {/* Интерактивный режим прохождения теста */}
      <TestModal
        isOpen={!!activeTest}
        onClose={closeTest}
        test={activeTest?.test || null}
        onComplete={handleTestComplete}
      />
    </div>
  );
}
